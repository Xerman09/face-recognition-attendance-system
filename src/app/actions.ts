"use server";

import { EntityConfig } from "@/types";

export async function getEntities(): Promise<EntityConfig[]> {
  const entities: EntityConfig[] = [];
  const env = process.env;

  // Find all keys that match API_BASE_* and are just the base URLs (no suffix like _NAME)
  // For example: API_BASE_I, API_BASE_II, API_BASE_III, etc.
  
  const baseKeys = Object.keys(env).filter(
    (key) => key.startsWith("API_BASE_") && !key.includes("_NAME") && !key.includes("_DESC") && !key.includes("_COLOR") && !key.includes("_TOKEN") && !key.includes("_ID")
  );

  for (const key of baseKeys) {
    const suffix = key.replace("API_BASE_", "");
    
    const url = env[key];
    const name = env[`API_BASE_NAME_${suffix}`];
    const id = env[`API_BASE_ID_${suffix}`];
    const desc = env[`API_BASE_DESC_${suffix}`];
    const color = env[`API_BASE_COLOR_${suffix}`];
    const token = env[`API_BASE_TOKEN_${suffix}`];

    if (url && name && id && token) {
      entities.push({
        id,
        name,
        description: desc || "",
        url: url.replace(/\/+$/, ""), // Trim trailing slash
        token,
        color: color || "#3b82f6",
      });
    }
  }

  // Sort by name or keep original order
  return entities;
}
