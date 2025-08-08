export default function LandingV2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-white text-black">
      <style dangerouslySetInnerHTML={{ __html: `
        /* Hide global header only on Landing V2 */
        header { display: none !important; }
      ` }} />
      {children}
    </div>
  );
}

