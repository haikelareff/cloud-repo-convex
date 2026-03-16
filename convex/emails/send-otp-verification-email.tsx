import { Heading, Text } from "@react-email/components";
import { BaseEmail, styles } from "./components/BaseEmail";

interface OTPVerificationProps {
  brandLogoUrl?: string;
  brandName?: string;
  brandTagline?: string;
  code: string;
}

export default function SendOTPVerificationEmail({
  code,
  brandName,
  brandTagline,
  brandLogoUrl,
}: OTPVerificationProps) {
  return (
    <BaseEmail
      brandLogoUrl={brandLogoUrl}
      brandName={brandName}
      brandTagline={brandTagline}
      previewText="Your verification code"
    >
      <Heading style={styles.h1}>Verify your email</Heading>
      <Text style={styles.text}>
        Enter this verification code to verify your email address:
      </Text>
      <code style={styles.code}>{code}</code>
      <Text
        style={{
          ...styles.text,
          color: "#ababab",
          marginTop: "14px",
          marginBottom: "16px",
        }}
      >
        If you didn&apos;t create an account, you can safely ignore this email.
      </Text>
    </BaseEmail>
  );
}
