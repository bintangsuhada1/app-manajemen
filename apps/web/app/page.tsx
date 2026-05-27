import { Header } from '@/components/Header';
import { QuoteForm } from '@/components/QuoteForm';
import { 
  ArrowRight, 
  BadgeCheck, 
  Building2, 
  ClipboardCheck, 
  Factory, 
  Landmark, 
  Mail, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  Zap, 
  Settings, 
  Power, 
  Sun, 
  Lightbulb, 
  ShieldAlert, 
  Wrench,
  CheckCircle2,
  FileText
} from 'lucide-react';

const servicesList = [
  {
    title: 'Instalasi Listrik Gedung',
    description: 'Instalasi kabel, tray, conduit, fitting, saklar, stop kontak, dan penerangan gedung bertingkat.',
    icon: Building2
  },
  {
    title: 'Panel Distribusi MDP/SDP',
    description: 'Perakitan, perbaikan, dan perawatan panel distribusi utama (MDP) dan panel pembagi (SDP).',
    icon: Settings
  },
  {
    title: 'Genset, ATS & AMF',
    description: 'Instalasi genset, panel automatic transfer switch (ATS) & automatic mains failure (AMF) untuk backup otomatis.',
    icon: Power
  },
  {
    title: 'PLTS Rooftop & Komunal',
    description: 'Pembangkit Listrik Tenaga Surya skala rumah tangga, industri, maupun komunal pedesaan.',
    icon: Sun
  },
  {
    title: 'PJU Solar Cell',
    description: 'Penerangan Jalan Umum dengan solar panel mandiri tanpa kabel tanah, efisien dan tahan lama.',
    icon: Lightbulb
  },
  {
    title: 'Grounding & Penangkal Petir',
    description: 'Sistem proteksi petir eksternal (electrostatic/faraday) dan pembumian peralatan di bawah 5 ohm.',
    icon: ShieldAlert
  },
  {
    title: 'Maintenance Kelistrikan',
    description: 'Perawatan berkala, pembersihan panel, thermography scanning, deteksi dini kerusakan kabel.',
    icon: Wrench
  },
  {
    title: 'Testing & Commissioning',
    description: 'Pengujian tahanan isolasi (megger), grounding test, uji fungsi sistem proteksi listrik.',
    icon: ClipboardCheck
  }
];

const projectsList = [
  {
    title: 'Instalasi Listrik Gedung 3 Lantai',
    location: 'Tanjungpinang',
    category: 'Gedung Komersial',
    description: 'Pemasangan instalasi listrik menyeluruh, tray kabel, panel sub-distribusi, dan pencahayaan hemat energi.'
  },
  {
    title: 'Panel Distribusi MDP/SDP 250kVA',
    location: 'Batam',
    category: 'Manufaktur & Industri',
    description: 'Perakitan panel utama dengan pengaman ACB, MCCB, LBS, serta sistem kontrol metering digital.'
  },
  {
    title: 'PJU Solar Cell 50 Titik',
    location: 'Bintan',
    category: 'Kawasan Publik',
    description: 'Pemasangan tiang oktagonal, solar panel monokristalin, baterai lithium, dan lampu LED terintegrasi.'
  },
  {
    title: 'Maintenance Sistem Listrik RS',
    location: 'Tanjungpinang',
    category: 'Infrastruktur Kesehatan',
    description: 'Thermovision scan panel, kalibrasi relay pengaman, pengujian grounding generator set rumah sakit.'
  }
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main id="beranda" className="overflow-hidden bg-slate-50">
        
        {/* HERO SECTION */}
        <section className="relative bg-navy py-24 text-white md:py-32">
          {/* Decorative radial gradients */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,165,36,0.25),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(14,42,77,0.8),transparent_50%)]" />
          
          {/* Animated subtle grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />

          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 md:grid-cols-12 md:px-8 items-center">
            <div className="md:col-span-7 space-y-6">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-gold">
                <Zap size={14} className="animate-bounce" /> Kontraktor Kelistrikan Profesional
              </span>
              <h1 className="text-4xl font-black leading-[1.1] text-white md:text-6xl tracking-tight">
                Sistem Kelistrikan Aman, <span className="text-gold">Rapi</span>, & Terstandar.
              </h1>
              <p className="max-w-xl text-base md:text-lg text-slate-300 font-normal leading-relaxed">
                PT Jurti Agung Mulia menangani instalasi listrik, panel MDP/SDP, genset, PLTS, PJU, grounding, maintenance, dan proyek dengan pendekatan engineering presisi, dokumentasi lengkap, dan manajemen proyek berbasis digital.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <a href="#penawaran" className="btn-primary inline-flex items-center gap-2 text-sm font-bold tracking-wide">
                  Minta Penawaran <ArrowRight size={18} />
                </a>
                <a href="https://wa.me/628xxxxxxxxxx" target="_blank" rel="noopener noreferrer" className="btn-dark border border-white/10 hover:border-white/30 inline-flex items-center justify-center text-sm">
                  Hubungi WhatsApp
                </a>
              </div>
            </div>
            
            <div className="md:col-span-5 relative">
              {/* Blur light glow */}
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-gold to-orange-500 opacity-20 blur-xl"></div>
              
              <div className="relative glass-card border-white/10 bg-white/5 p-8 backdrop-blur-lg">
                <div className="grid gap-4 grid-cols-2">
                  {[
                    ['Proyek Selesai', '120+'],
                    ['Layanan Spesialis', '8'],
                    ['Dokumen Teknis', 'Lengkap'],
                    ['Sertifikasi K3', 'Terpenuhi']
                  ].map(([label, val]) => (
                    <div key={label} className="rounded-xl bg-white/10 border border-white/10 p-5 backdrop-blur-md transition-all duration-300 hover:bg-white/15">
                      <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{label}</p>
                      <p className="mt-2 text-2xl md:text-3xl font-black text-white tracking-tight">{val}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-xl bg-gradient-to-r from-gold to-orange-500 p-6 text-navy shadow-lg shadow-orange-500/20">
                  <p className="font-extrabold text-base tracking-wide flex items-center gap-2">
                    <ShieldCheck size={20} /> Premium Electrical PM
                  </p>
                  <p className="mt-2 text-xs font-medium text-navy/90 leading-relaxed">
                    Sistem pemantauan progres real-time mulai dari survey lapangan, RAB, dokumen teknis, mobilisasi material, hingga penagihan terintegrasi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TENTANG KAMI */}
        <section id="tentang" className="mx-auto max-w-7xl px-4 py-24 md:px-8">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div className="space-y-6">
              <span className="font-extrabold text-xs uppercase tracking-widest text-gold bg-gold/10 px-3.5 py-1.5 rounded-md">Tentang Perusahaan</span>
              <h2 className="text-3xl font-black tracking-tight text-navy md:text-4xl leading-tight">
                Membangun Standar Baru Kontraktor Kelistrikan di Kepulauan Riau.
              </h2>
              <div className="h-1.5 w-20 bg-gold rounded-full"></div>
            </div>
            <div className="space-y-4">
              <p className="text-slate-600 text-base md:text-lg leading-relaxed">
                PT Jurti Agung Mulia adalah perusahaan kontraktor dan konsultan sistem kelistrikan terpercaya. Kami berfokus pada kualitas pengerjaan (craftsmanship), keselamatan kerja standar K3, efisiensi anggaran, serta transparansi dokumentasi proyek.
              </p>
              <p className="text-slate-500 text-sm md:text-base leading-relaxed">
                Melalui tim ahli bersertifikasi dan platform manajemen internal yang modern, kami memastikan setiap fase instalasi terdokumentasi dengan baik, memudahkan proses serah terima dan audit kelistrikan.
              </p>
            </div>
          </div>
        </section>

        {/* LAYANAN SPESIALIS */}
        <section id="layanan" className="bg-slate-100 py-24">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
              <span className="font-extrabold text-xs uppercase tracking-widest text-gold bg-gold/10 px-3.5 py-1.5 rounded-md inline-block">Layanan Kami</span>
              <h2 className="text-3xl font-black tracking-tight text-navy md:text-4xl">Solusi Kelistrikan Komprehensif</h2>
              <p className="text-slate-600 text-sm md:text-base">
                Kami melayani berbagai kebutuhan rekayasa, instalasi, dan pemeliharaan kelistrikan untuk sektor industri, komersial, maupun residensial.
              </p>
            </div>
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {servicesList.map((s, idx) => {
                const IconComponent = s.icon;
                return (
                  <div key={idx} className="card bg-white p-6 hover:-translate-y-2 hover:shadow-premium hover:border-gold/30 hover:scale-[1.02] duration-300 flex flex-col justify-between group">
                    <div>
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-soft text-navy transition-all duration-300 group-hover:bg-gold group-hover:text-navy">
                        <IconComponent size={24} />
                      </div>
                      <h3 className="mt-5 text-lg font-bold text-navy group-hover:text-gold transition-colors duration-300">{s.title}</h3>
                      <p className="mt-2 text-xs text-slate-500 leading-relaxed">{s.description}</p>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-navy/80 hover:text-gold cursor-pointer transition-colors duration-300">
                      <span>Detail Layanan</span>
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* PORTOFOLIO KATEGORI */}
        <section id="portofolio" className="mx-auto max-w-7xl px-4 py-24 md:px-8">
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
            <span className="font-extrabold text-xs uppercase tracking-widest text-gold bg-gold/10 px-3.5 py-1.5 rounded-md inline-block">Portofolio</span>
            <h2 className="text-3xl font-black tracking-tight text-navy md:text-4xl">Kategori Proyek Unggulan</h2>
            <p className="text-slate-600 text-sm md:text-base">
              Berbagai macam kategori pekerjaan kelistrikan yang telah sukses kami tangani dan serahkan dengan dokumentasi pengujian lengkap.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {projectsList.map((p, idx) => (
              <div key={idx} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-premium transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-gold/30 hover:scale-[1.02]">
                <div className="relative h-40 bg-gradient-to-br from-navy to-navy2 flex items-center justify-center p-6 text-center text-white overflow-hidden">
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute top-3 left-3 rounded-full bg-gold/20 border border-gold/40 px-3 py-1 text-[10px] font-bold text-gold uppercase tracking-wider">
                    {p.category}
                  </div>
                  <Building2 size={40} className="text-white/20 absolute right-4 bottom-4" />
                  <p className="relative font-bold text-sm leading-snug">{p.title}</p>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <MapPin size={14} className="text-gold" />
                    <span>{p.location}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {p.description}
                  </p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                    <span className="flex items-center gap-1"><CheckCircle2 size={12} className="text-emerald-500" /> Pengujian Ok</span>
                    <span className="flex items-center gap-1"><FileText size={12} className="text-blue-500" /> Laporan PDF</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* LEGALITAS DAN STANDAR */}
        <section id="legalitas" className="bg-navy py-24 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(245,165,36,0.15),transparent_40%)] pointer-events-none" />
          <div className="mx-auto max-w-7xl px-4 md:px-8 relative">
            <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
              <span className="font-extrabold text-xs uppercase tracking-widest text-gold bg-gold/10 px-3.5 py-1.5 rounded-md inline-block">Legalitas</span>
              <h2 className="text-3xl font-black tracking-tight text-white md:text-4xl">Kepatuhan Regulasi & Standar K3</h2>
              <p className="text-slate-300 text-sm md:text-base">
                Menjamin ketenangan pikiran Anda dengan kelengkapan izin usaha kontraktor listrik dan implementasi manajemen keselamatan kerja yang ketat.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: 'NIB / OSS Berizin', desc: 'Terdaftar secara legal pada sistem Online Single Submission untuk pengerjaan konstruksi listrik.' },
                { title: 'Sertifikasi Kompetensi', desc: 'Tenaga teknis bersertifikat keahlian kelistrikan (SKA/SKT) resmi dari asosiasi terakreditasi.' },
                { title: 'SOP K3 & APD Lengkap', desc: 'Wajib menggunakan alat pelindung diri standar (helm, sarung tangan isolasi, sepatu safety) di lapangan.' },
                { title: 'Laporan Uji Handal', desc: 'Menyerahkan berkas pengujian teknis yang siap diajukan untuk penerbitan SLO (Sertifikat Laik Operasi).' }
              ].map((item, idx) => (
                <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-gold/30">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-gold mb-4">
                    <ShieldCheck size={20} />
                  </div>
                  <h3 className="text-base font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-xs text-slate-300 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HUBUNGI KAMI / KONTAK */}
        <section id="kontak" className="mx-auto grid max-w-7xl gap-12 px-4 py-24 md:grid-cols-2 md:px-8 items-start">
          <div className="space-y-6">
            <span className="font-extrabold text-xs uppercase tracking-widest text-gold bg-gold/10 px-3.5 py-1.5 rounded-md inline-block">Kontak Kami</span>
            <h2 className="text-3xl font-black text-navy md:text-4xl">Konsultasikan Proyek Kelistrikan Anda</h2>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
              Butuh estimasi biaya, survei lokasi, atau punya kebutuhan teknis khusus? Silakan isi form penawaran atau hubungi saluran kontak di bawah. Tim marketing dan engineering kami akan segera merespons Anda.
            </p>
            
            <div className="space-y-4 pt-4 text-slate-600">
              <div className="flex gap-4 items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lokasi Kantor</p>
                  <p className="text-sm font-semibold text-navy">Tanjungpinang, Kepulauan Riau, Indonesia</p>
                </div>
              </div>

              <div className="flex gap-4 items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp Hotline</p>
                  <p className="text-sm font-semibold text-navy">+62 822-xxxx-xxxx</p>
                </div>
              </div>

              <div className="flex gap-4 items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Korespondensi</p>
                  <p className="text-sm font-semibold text-navy">admin@ptjurtiagungmulia.com</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-gold to-orange-500 opacity-10 blur-xl"></div>
            <QuoteForm />
          </div>
        </section>

      </main>
      
      {/* FOOTER */}
      <footer className="bg-navy border-t border-white/10 py-12 text-slate-400 text-xs">
        <div className="mx-auto max-w-7xl px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gold font-bold text-navy">
              J
            </div>
            <div>
              <p className="font-bold text-white">PT Jurti Agung Mulia</p>
              <p className="text-[9px] uppercase font-semibold text-slate-500 tracking-wider">Electrical Contractor & Engineering</p>
            </div>
          </div>
          <p>© {new Date().getFullYear()} PT Jurti Agung Mulia. Hak Cipta Dilindungi Undang-Undang.</p>
        </div>
      </footer>
    </>
  );
}

