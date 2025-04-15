/**
 * 截断以太坊地址，显示前6位和后4位
 * @param address 以太坊地址
 * @returns 截断后的地址
 */
export function truncateAddress(address: string): string {
  if (!address) return '';
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const getEtherscanUrl = (address: string) => {
  return `https://bscscan.com/address/${address}`;
}; 