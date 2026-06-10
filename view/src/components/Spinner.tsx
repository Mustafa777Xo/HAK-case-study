interface Props {
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
};

export default function Spinner({ size = "md" }: Props) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-gray-300 border-t-brand-600 ${sizes[size]}`}
      role="status"
      aria-label="Loading"
    />
  );
}
