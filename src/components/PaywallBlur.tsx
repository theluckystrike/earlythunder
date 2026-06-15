interface PaywallBlurProps {
  readonly children: React.ReactNode;
  readonly bypass?: boolean;
}

/** Pass-through wrapper, paywall removed. */
export default function PaywallBlur({ children }: PaywallBlurProps) {
  return <>{children}</>;
}
