import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
if (!sdk || !existsSync(`${sdk}/platforms/android-36/android.jar`)) {
  console.error(
    "Android SDK platform 36 is required. Install it through Android Studio/SDK Manager and review its licences. No AAB was built.",
  );
  process.exit(1);
}
const project = fileURLToPath(new URL("../../android/twa/", import.meta.url));
const result = spawnSync(
  process.platform === "win32" ? "gradlew.bat" : "./gradlew",
  [":app:bundleRelease", "--no-daemon", "--console=plain"],
  { cwd: project, stdio: "inherit", shell: process.platform === "win32" },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
const artifact = `${project}app/build/outputs/bundle/release/app-release.aab`;
if (!existsSync(artifact))
  throw new Error("Build completed without the expected app bundle.");
console.log(
  `Unsigned bundle: ${artifact}. This cannot be submitted to Play until signed with the owner's upload key.`,
);
