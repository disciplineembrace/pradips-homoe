import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12">
        <h1 className="font-serif text-4xl text-[#173B2D] mb-2">Contact</h1>
        <div className="w-16 h-0.5 bg-amber-700 mb-4" />
        <p className="text-[#5a6b50] mb-8">Need access to the library? Have questions? Reach out using the details below.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="font-serif text-xl text-[#173B2D] mb-3">Get Access</h2>
            <p className="text-stone-700 text-sm leading-relaxed mb-4">
              This is a private library. New accounts are created only by the administrator. To request access:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-stone-700">
              <li>Email the administrator with your name and purpose</li>
              <li>Wait for account approval and credential setup</li>
              <li>Receive your Login ID, Password, and 6-digit PIN</li>
              <li>Login at <a href="/login" className="text-[#C8A24A] underline">/login</a> and change your password (PIN can only be reset by admin)</li>
            </ol>
          </section>

          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="font-serif text-xl text-[#173B2D] mb-3">Administrator</h2>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-[#7C8F6E] uppercase tracking-wider">Name</div>
                <div className="text-stone-800 font-semibold">Pradip Sagathiya</div>
              </div>
              <div>
                <div className="text-xs text-[#7C8F6E] uppercase tracking-wider">Email</div>
                <a href="mailto:sagathiyapradip2002@gmail.com" className="text-[#C8A24A] underline">sagathiyapradip2002@gmail.com</a>
              </div>
              <div>
                <div className="text-xs text-[#7C8F6E] uppercase tracking-wider">Response Time</div>
                <div className="text-stone-800">Usually within 24-48 hours</div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg shadow p-6 md:col-span-2">
            <h2 className="font-serif text-xl text-[#173B2D] mb-3">Support &amp; Feedback</h2>
            <p className="text-stone-700 text-sm leading-relaxed mb-4">
              For technical issues (login problems, locked PIN, data errors) or to suggest improvements, please email the administrator with:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-stone-700">
              <li>Your Login ID (do <b>not</b> send your password or PIN over email)</li>
              <li>Description of the issue or suggestion</li>
              <li>Browser and device you&apos;re using</li>
              <li>Screenshot if applicable</li>
            </ul>
          </section>

          <section className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 md:col-span-2">
            <h2 className="font-serif text-xl text-[#173B2D] mb-3">Login Help</h2>
            <p className="text-stone-700 text-sm leading-relaxed">
              <b>Forgot password?</b> The administrator can reset it for you — contact via email.<br />
              <b>Forgot PIN?</b> The administrator can reset your PIN — you cannot reset it yourself.<br />
              <b>Account locked?</b> After 3 failed PIN attempts, your account locks for 15 minutes. The administrator can also unlock it immediately.<br />
              <b>Account disabled?</b> If you see &quot;Account disabled&quot; at login, contact the administrator to re-activate.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
