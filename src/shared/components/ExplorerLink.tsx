import { shortenAddress } from '@/shared/utils/format';
import {
  getAddressExplorerUrl,
  getTxExplorerUrl,
  getAttestationExplorerUrl,
} from '@/shared/utils/explorer';

type ExplorerLinkType = 'address' | 'tx' | 'attestation';

interface ExplorerLinkProps {
  type: ExplorerLinkType;
  value: string;
  chars?: number;
  className?: string;
}

const urlBuilders: Record<ExplorerLinkType, (value: string) => string> = {
  address: getAddressExplorerUrl,
  tx: getTxExplorerUrl,
  attestation: getAttestationExplorerUrl,
};

export function ExplorerLink({ type, value, chars = 4, className }: ExplorerLinkProps) {
  const href = urlBuilders[type](value);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? 'font-mono text-xs text-skin-heading hover:underline'}
      title={value}
    >
      {shortenAddress(value, chars)}
    </a>
  );
}
