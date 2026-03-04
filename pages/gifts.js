import dynamic from 'next/dynamic';

const GiftShop = dynamic(() => import('../src/GiftShop'), { ssr: false });

export default function Gifts() {
  return <GiftShop />;
}
