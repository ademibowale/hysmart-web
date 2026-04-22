import * as LocalAuthentication from "expo-local-authentication";

export async function biometricLogin(callback) {
  try {

    // Check hardware support
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      console.log("Biometric hardware not available");
      return false;
    }

    // Check if biometrics are enrolled
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      console.log("No biometric records found");
      return false;
    }

    // Authenticate
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Login with Biometrics",
      fallbackLabel: "Use Passcode",
      disableDeviceFallback: false,
    });

    if (result.success) {
      if (typeof callback === "function") {
        callback();
      }
      return true;
    }

    return false;

  } catch (error) {
    console.log("Biometric login error:", error);
    return false;
  }
}