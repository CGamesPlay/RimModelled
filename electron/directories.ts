import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import envPaths from "env-paths";
import { z } from "zod";

import { logger } from "./logging";

const validDirectory = z
  .string()
  .min(1)
  .refine(
    (val: string) => fs.statSync(val, { throwIfNoEntry: false })?.isDirectory(),
    { message: "Directory does not exist" }
  );

export const DirectoryConfig = z.object({
  steamapps: validDirectory,
  rimworld: validDirectory,
});
export type DirectoryConfig = z.infer<typeof DirectoryConfig>;

export const RimworldPaths = z.object({
  mods: validDirectory.array(),
  data: validDirectory,
  lib: validDirectory,
});
export type RimworldPaths = z.infer<typeof RimworldPaths>;

export function loadDirectoryConfig(): DirectoryConfig {
  let input: any;
  try {
    const paths = envPaths("RimModelled", { suffix: "" });
    const configPath = path.join(paths.data, "directories.json");
    const configData = fs.readFileSync(configPath, "utf-8");
    input = JSON.parse(configData);
  } catch (error) {
    logger.warn("failed to load saved directory config", { error });
    return getDefaultDirectories();
  }
  const result = DirectoryConfig.safeParse(input);
  if (!result.success) {
    logger.error("saved directory config is invalid", {
      input,
      error: result.error,
    });
    throw new Error("saved Steam directories are invalid");
  }
  return result.data;
}

function getDefaultDirectories(): DirectoryConfig {
  const queriedEnv: Record<string, string> = {};
  function getEnv(name: string): string | undefined {
    queriedEnv[name] = process.env[name] ?? "";
    return process.env[name];
  }
  const platform = os.platform();
  let input: any;
  if (platform === "darwin") {
    input = {
      steamapps:
        getEnv("STEAMAPPS") ??
        path.join(
          getEnv("HOME") ?? "./",
          "Library/Application Support/Steam/steamapps"
        ),
      rimworld: path.join(
        getEnv("HOME") ?? "./",
        "Library/Application Support/RimWorld"
      ),
    };
  } else if (platform === "win32") {
    input = {
      steamapps:
        getEnv("STEAMAPPS") ??
        path.join(
          getEnv("ProgramFiles(x86)") ?? getEnv("ProgramFiles") ?? "C:/",
          "Steam/steamapps"
        ),
      rimworld: path.join(
        getEnv("LOCALAPPDATA") ?? "C:/",
        "../LocalLow/Ludeon Studios/RimWorld by Ludeon Studios"
      ),
    };
  } else {
    throw new Error(`Steam directories not known for platform ${platform}`);
  }

  const result = DirectoryConfig.safeParse(input);
  if (!result.success) {
    logger.error("unable to guess directory config", {
      input,
      error: result.error,
      env: queriedEnv,
    });
    throw new Error(`unable to determine Steam directories`, {
      cause: result.error,
    });
  }
  return result.data;
}

export function getRimworldPaths(paths: DirectoryConfig): RimworldPaths {
  const platform = os.platform();
  let input: RimworldPaths;
  if (platform === "darwin") {
    input = {
      mods: [
        path.join(paths.steamapps, "common/RimWorld/RimWorldMac.app/Data"),
        path.join(paths.steamapps, "common/RimWorld/RimWorldMac.app/Mods"),
        path.join(paths.steamapps, "workshop/content/294100"),
      ],
      data: paths.rimworld,
      lib: path.join(paths.steamapps, "common/RimWorld/RimWorldMac.app"),
    };
  } else if (platform === "win32") {
    input = {
      mods: [
        path.join(paths.steamapps, "common/RimWorld/Data"),
        path.join(paths.steamapps, "common/RimWorld/Mods"),
        path.join(paths.steamapps, "workshop/content/294100"),
      ],
      data: paths.rimworld,
      lib: path.join(paths.steamapps, "common/RimWorld"),
    };
  } else {
    throw new Error(`RimWorld paths not known for platform ${platform}`);
  }

  const result = RimworldPaths.safeParse(input);
  if (!result.success) {
    logger.error("failed to determine RimWorld location", {
      input,
      paths,
      error: result.error,
    });
    throw new Error(`RimWorld paths are invalid`);
  }
  return result.data;
}
