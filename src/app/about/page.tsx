import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE0]">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12">
        <h1 className="font-serif text-4xl text-[#173B2D] mb-2">About Pradip&apos;s Homoe</h1>
        <div className="w-16 h-0.5 bg-amber-700 mb-4" />
        <p className="text-[#5a6b50] mb-8">A personal digital homoeopathy library built for practitioners, students, and serious learners.</p>

        <div className="prose prose-stone max-w-none space-y-6">
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="font-serif text-2xl text-[#173B2D] mb-3">Our Mission</h2>
            <p className="text-stone-700 leading-relaxed">
              Pradip&apos;s Homoe is a private digital library dedicated to preserving and providing secure access to classical homoeopathic literature. The platform brings together materia medica, repertories, therapeutics, and predictive homeopathy teachings from renowned authors — all in one searchable, readable interface.
            </p>
            <p className="text-stone-700 leading-relaxed mt-3">
              Unlike public resources, this library is access-controlled. Only users created by the administrator can login, ensuring the content reaches the intended audience while maintaining privacy and audit trails.
            </p>
          </section>

          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="font-serif text-2xl text-[#173B2D] mb-3">Collection</h2>
            <ul className="space-y-2 text-stone-700">
              <li><b className="text-[#173B2D]">Materia Medica</b> — 3,471 remedies from 9 authors: Boericke, Phatak, Murphy, Kent, Allen, Sankaran, Farrington, Boeger, and Mathur.</li>
              <li><b className="text-[#173B2D]">Repertory</b> — 79,706 rubrics spanning Kent (62,696), Phatak (10,840), and Murphy (6,169).</li>
              <li><b className="text-[#173B2D]">Therapeutics</b> — 408 disease categories with remedy formulas and potencies, sourced from the Encyclopedia of Homoeopathic Formulas by Dr. Saif-ud-Din Saif.</li>
              <li><b className="text-[#173B2D]">Predictive Homeopathy</b> — Theory of Suppression and Theory of Acutes by Dr. Prafull Vijayakar, 23 chapters of full text.</li>
              <li><b className="text-[#173B2D]">Synthesis Repertory</b> — Cross-referenced rubric data for advanced repertorization.</li>
            </ul>
          </section>

          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="font-serif text-2xl text-[#173B2D] mb-3">Security &amp; Privacy</h2>
            <p className="text-stone-700 leading-relaxed mb-3">
              Every access to this library is logged. The platform uses a two-factor authentication system:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-stone-700">
              <li><b>Password</b> — verified via bcrypt (10 rounds of hashing)</li>
              <li><b>6-digit PIN</b> — a fixed personal identification number, hashed with bcrypt (12 rounds), separate from the password</li>
            </ol>
            <p className="text-stone-700 leading-relaxed mt-3">
              The PIN is <b>not</b> an OTP — it is not generated on-the-fly, not sent via SMS or email, and cannot be reset by the user. Only the administrator can create or reset PINs. After 3 failed PIN attempts, the account is locked for 15 minutes.
            </p>
          </section>

          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="font-serif text-2xl text-[#173B2D] mb-3">Technology</h2>
            <p className="text-stone-700 leading-relaxed">
              Built on Next.js 16 with TypeScript, Prisma ORM, and Tailwind CSS. Data is stored on Neon Postgres (serverless PostgreSQL). All remedy data lives server-side — it is never exposed in the frontend bundle, and every API request is authenticated before data is returned.
            </p>
          </section>

          <section className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h2 className="font-serif text-2xl text-[#C8A24A] mb-3">Disclaimer</h2>
            <p className="text-stone-700 leading-relaxed text-sm">
              This library is for educational and reference purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified homoeopathic practitioner before using any remedy. The administrator and contributors are not responsible for any consequences arising from self-medication based on this library&apos;s content.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
