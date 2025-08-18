import Image from "next/image";

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  showText?: boolean;
}

export default function Logo({ 
  className = "", 
  width = 200, 
  height = 60, 
  showText = true 
}: LogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/logo-design-5-modern-geometric.svg"
        alt="SnapReview.ai"
        width={width}
        height={height}
        className="h-auto"
        priority
      />
      {!showText && (
        <span className="ml-2 text-xl font-bold text-gray-900">
          SnapReview.ai
        </span>
      )}
    </div>
  );
}

// Compact version for headers
export function CompactLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/logo-design-5-modern-geometric.svg"
        alt="SnapReview.ai"
        width={120}
        height={36}
        className="h-auto"
        priority
      />
    </div>
  );
}