import dotenv from "dotenv";
dotenv.config();

export const config = {
  bagsApiKey: process.env.BAGS_API_KEY || "",
  bagsApiBase: "https://public-api-v2.bags.fm/api/v1",
  solanaRpcUrl: process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
  groqApiKey: process.env.GROQ_API_KEY || "",
  privateKey: process.env.PRIVATE_KEY || "",
  port: parseInt(process.env.PORT || "3001", 10),
};
