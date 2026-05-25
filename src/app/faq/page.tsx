'use client';

import Navbar from '@/components/Navbar';
import CreatorCredit from '@/components/CreatorCredit';

const faqs = [
  {
    q: 'How do I claim a pixel?',
    a: 'Click on any empty blue pixel in the mosaic grid (the ones inside the Coinbase logo circle). Sign in with your X account, write a message up to 100 characters, and click "Claim Pixel". Your profile photo will immediately fill that spot.',
  },
  {
    q: 'Can I change my pixel after claiming?',
    a: 'No. Once a pixel is claimed, it is permanently associated with your X account. You cannot move it, change the message, or claim another one. Choose carefully!',
  },
  {
    q: 'How many pixels can I claim?',
    a: 'One. Each X account can claim exactly one pixel. This ensures that every pixel represents a unique person in the Coinbase community.',
  },
  {
    q: 'What happens if I delete my X account?',
    a: 'Your pixel remains in the mosaic. The profile photo may stop loading, but the pixel stays claimed under your X username. There is no way to "unclaim" or transfer a pixel.',
  },
  {
    q: 'Is this affiliated with Coinbase?',
    a: 'No. Coinbase Mosaic is an independent community art project created by @Zkfync. It is not affiliated with, endorsed by, or sponsored by Coinbase Inc. It is a tribute to the Coinbase community.',
  },
  {
    q: 'Does this use blockchain or NFTs?',
    a: 'No blockchain, no NFTs, no tokens, no wallet required. Pixel claims are stored in a simple database. This keeps it accessible to everyone — no gas fees, no complexity.',
  },
  {
    q: 'What is the pixel scatter effect?',
    a: 'Around the edges of the Coinbase logo circle, some pixels appear slightly offset or scattered. This creates a grunge/glitch aesthetic that makes the mosaic feel organic and alive, rather than a perfect vector graphic.',
  },
  {
    q: 'How big is the mosaic?',
    a: 'The canvas is 100 × 100 pixels (10,000 total cells). Of these, approximately 6,092 form the Coinbase logo circle and can be claimed. The remaining cells outside the circle are decorative background.',
  },
  {
    q: 'Can I use a custom profile photo?',
    a: 'Your profile photo is automatically pulled from your X account. If you sign in with X OAuth, it uses your actual X avatar. If you enter your username manually, it generates a Gravatar-style avatar based on your handle.',
  },
  {
    q: 'Is my pixel really permanent?',
    a: 'Yes. Once claimed, your pixel record is stored permanently in the database. As long as this website exists, your pixel will remain. There is no mechanism for deletion or modification.',
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-16">
      <Navbar onConnectClick={() => {}} />

      <div className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-white text-4xl font-bold tracking-tight mb-4">Frequently Asked Questions</h1>
        <p className="text-white/50 text-lg mb-16 leading-relaxed">
          Everything you need to know about Coinbase Mosaic.
        </p>

        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-white/[0.06] rounded-2xl p-6 bg-white/[0.02]">
              <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-white/30 text-sm">
            Still have questions? Reach out to{' '}
            <a href="https://x.com/Zkfync" target="_blank" rel="noopener noreferrer" className="text-[#0052FF] hover:underline">@Zkfync</a> on X.
          </p>
        </div>
      </div>

      <CreatorCredit />
    </div>
  );
}
