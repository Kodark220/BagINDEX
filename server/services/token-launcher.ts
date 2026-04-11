import { BagsSDK } from "@bagsfm/bags-sdk";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import { config } from "../config";

let sdk: BagsSDK | null = null;
let connection: Connection | null = null;

function getSDK(): BagsSDK {
  if (!sdk) {
    connection = new Connection(config.solanaRpcUrl);
    sdk = new BagsSDK(config.bagsApiKey, connection, "processed");
  }
  return sdk;
}

function getConnection(): Connection {
  if (!connection) {
    connection = new Connection(config.solanaRpcUrl);
  }
  return connection;
}

function getKeypair(): Keypair {
  if (!config.privateKey) throw new Error("PRIVATE_KEY not set in .env");
  return Keypair.fromSecretKey(bs58.decode(config.privateKey));
}

/**
 * Launch the BagsIndex token on Bags.
 * This creates the project token for the hackathon submission.
 */
export async function launchBagsIndexToken(params: {
  imageUrl: string;
  name?: string;
  symbol?: string;
  description?: string;
  twitterUrl?: string;
  websiteUrl?: string;
  initialBuyLamports?: number;
}): Promise<{ tokenMint: string; signature: string; metadataUri: string }> {
  const bagsSDK = getSDK();
  const conn = getConnection();
  const keypair = getKeypair();
  const commitment = bagsSDK.state.getCommitment();

  const name = params.name || "BagsIndex";
  const symbol = params.symbol || "BIDX";
  const description =
    params.description ||
    "BagsIndex — AI-powered index funds for Bags creator tokens. Diversify across the entire creator economy with curated, auto-rebalancing token baskets.";
  const initialBuy = params.initialBuyLamports || 0.01 * LAMPORTS_PER_SOL;

  console.log(`🚀 Launching $${symbol} token...`);

  // Step 1: Create metadata
  console.log("📝 Creating token metadata...");
  const tokenInfo = await bagsSDK.tokenLaunch.createTokenInfoAndMetadata({
    imageUrl: params.imageUrl,
    name,
    description,
    symbol: symbol.toUpperCase().replace("$", ""),
    twitter: params.twitterUrl,
    website: params.websiteUrl,
  });

  console.log(`🪙 Token mint: ${tokenInfo.tokenMint}`);

  const tokenMint = new PublicKey(tokenInfo.tokenMint);

  // Step 2: Create fee share config (all fees to creator)
  console.log("⚙️ Creating fee share config...");
  const feeClaimers = [{ user: keypair.publicKey, userBps: 10000 }];

  const configResult = await bagsSDK.config.createBagsFeeShareConfig({
    payer: keypair.publicKey,
    baseMint: tokenMint,
    feeClaimers,
  });

  // Sign and send config transactions
  for (const tx of configResult.transactions || []) {
    tx.sign([keypair]);
    const rawTx = tx.serialize();
    const sig = await conn.sendRawTransaction(rawTx, { skipPreflight: false });
    await conn.confirmTransaction(sig, commitment);
  }

  console.log(`🔑 Config key: ${configResult.meteoraConfigKey.toString()}`);

  // Step 3: Create launch transaction
  console.log("🎯 Creating launch transaction...");
  const launchTx = await bagsSDK.tokenLaunch.createLaunchTransaction({
    metadataUrl: tokenInfo.tokenMetadata,
    tokenMint,
    launchWallet: keypair.publicKey,
    initialBuyLamports: initialBuy,
    configKey: configResult.meteoraConfigKey,
  });

  // Step 4: Sign and send
  console.log("📡 Signing and broadcasting...");
  launchTx.sign([keypair]);
  const rawTx = launchTx.serialize();
  const signature = await conn.sendRawTransaction(rawTx, { skipPreflight: false });
  await conn.confirmTransaction(signature, commitment);

  console.log("🎉 Token launched successfully!");
  console.log(`🪙 Mint: ${tokenInfo.tokenMint}`);
  console.log(`🔗 https://bags.fm/${tokenInfo.tokenMint}`);

  return {
    tokenMint: tokenInfo.tokenMint,
    signature,
    metadataUri: tokenInfo.tokenMetadata,
  };
}
