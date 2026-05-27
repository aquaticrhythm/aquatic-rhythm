/**
 * Patches MS and ID translation JSON files with missing hint block translations.
 * Adds hintLabel/hintText entries for all hn blocks that had no translation.
 *
 * Run: node scripts/patch-translations.mjs
 */

import fs from 'fs';
import path from 'path';

const ROOT      = path.join(import.meta.dirname, '..');
const TRANS_DIR = path.join(ROOT, 'translations');

// ── Translation data ──────────────────────────────────────────────────────────
// Format: { slug, lang, modIdx (0-based), hintN (1|2|3), label, text: string[] }

const PATCHES = [

  // ══ adding-new-fish ══════════════════════════════════════════════════════════
  // mod-1: ARA · All Five Rhythms (currently 0 hints → add as hintLabel)
  // mod-3: ARA · Keeper Rhythm    (currently 1 hint  → add as hintLabel2)

  { slug:'adding-new-fish', lang:'ms', modIdx:0, hintN:1,
    label:'ARA · Kelima-lima Ritma',
    text:['Dalam ARA, menambah ikan baru mengganggu kelima-lima ecological rhythms serentak: koloni bakteria menyesuaikan diri dengan bioload baru (Biological Rhythm), kimia air berubah (Water Rhythm), kawasan territory disusun semula (Environmental Rhythm), ikan sedia ada bertindak balas secara sosial (Livestock Rhythm), dan penjaga mengharungi ketidaktentuan (Keeper Rhythm). Gangguan itu dijangkakan — ia adalah cara sistem mengintegrasikan maklumat baru. Tindak balas yang selaras adalah pemerhatian: tunggu tangki menyemula kembali keseimbangan sendiri sebelum campur tangan.'] },

  { slug:'adding-new-fish', lang:'ms', modIdx:2, hintN:2,
    label:'ARA · Keeper Rhythm',
    text:['Bahagian yang paling sukar semasa tetingkap gangguan ialah melihat ikan bersembunyi atau kelihatan tertekan, sambil menahan dorongan untuk melakukan sesuatu. Kita cenderung menyamakan masalah yang kelihatan dengan keperluan tindakan yang kelihatan. Tetapi tetingkap dua minggu ini adalah ujian satu jenis penjagaan yang berbeza — terus bertahan apabila tangki kelihatan tidak menentu. Menahan diri itu sendiri adalah keputusan aktif. Ia salah satu perkara yang paling kontra-intuitif yang hobi ini ajar.'] },

  { slug:'adding-new-fish', lang:'id', modIdx:0, hintN:1,
    label:'ARA · Kelima Ritme',
    text:['Dalam ARA, menambahkan ikan baru mengganggu kelima ecological rhythms secara bersamaan: koloni bakteri menyesuaikan diri dengan bioload baru (Biological Rhythm), kimia air berubah (Water Rhythm), wilayah diatur ulang (Environmental Rhythm), ikan yang sudah ada merespons secara sosial (Livestock Rhythm), dan penjaga menavigasi ketidakpastian (Keeper Rhythm). Gangguan itu memang diharapkan — itulah cara sistem mengintegrasikan informasi baru. Respons yang selaras adalah observasi: tunggu tangki menyeimbangkan kembali keseimbangannya sendiri sebelum berintervasi.'] },

  { slug:'adding-new-fish', lang:'id', modIdx:2, hintN:2,
    label:'ARA · Keeper Rhythm',
    text:['Bagian yang paling sulit selama jendela gangguan adalah melihat ikan bersembunyi atau tampak stres sambil menahan dorongan untuk melakukan sesuatu. Kita cenderung menyamakan masalah yang terlihat dengan kebutuhan tindakan yang terlihat. Tapi jendela dua minggu ini adalah ujian jenis pemeliharaan yang berbeda — bertahan ketika tangki terlihat tidak menentu. Pengendalian diri itu sendiri adalah keputusan aktif. Ini adalah salah satu hal yang paling kontra-intuitif yang diajarkan hobi ini.'] },

  // ══ algae-in-aquarium ════════════════════════════════════════════════════════
  // mod-4: ARA · Keeper Rhythm (currently 1 hint → add as hintLabel2)

  { slug:'algae-in-aquarium', lang:'ms', modIdx:3, hintN:2,
    label:'ARA · Keeper Rhythm',
    text:['Alga membawa lebih banyak rasa malu berbanding hampir semua masalah akuarium lain. Tangki yang bersih dan jernih dalam gambar tidak mempunyainya. Lajur nasihat menganggapnya sebagai sesuatu yang perlu dihapuskan. Pengalaman menjumpai alga rambut pada kaca atau black beard algae pada hiasan kegemaran boleh terasa seperti bukti penjagaan yang lemah — kegagalan yang kelihatan di hadapan mata. Rasa malu itu wajar diperiksa, kerana ia cenderung menghasilkan tindak balas yang paling tidak berkesan: menggosok dalam panik, pelbagai campur tangan serentak, atau perasaan bahawa hobi ini lebih susah bagi anda berbanding orang lain. Alga adalah pembacaan keadaan, bukan keputusan muktamad. Setiap tangki menghasilkan syarat untuk sejenis alga pada sesetengah ketika. Soalan yang berguna bukan "kenapa saya ada alga" tetapi "apakah yang Environmental Rhythm sedang luahkan sekarang."'] },

  { slug:'algae-in-aquarium', lang:'id', modIdx:3, hintN:2,
    label:'ARA · Keeper Rhythm',
    text:['Alga membawa rasa malu lebih dari hampir semua masalah akuarium lainnya. Tangki yang bersih dan jernih di foto tidak memilikinya. Kolom saran memperlakukannya sebagai sesuatu yang harus dihilangkan. Pengalaman menemukan alga rambut di kaca atau black beard algae di hiasan favorit bisa terasa seperti bukti perawatan yang buruk — kegagalan yang terlihat. Rasa malu itu layak diperiksa, karena cenderung menghasilkan respons yang paling tidak efektif: membersihkan panik, beberapa intervensi serentak, atau perasaan bahwa hobi ini lebih sulit bagi Anda dari orang lain. Alga adalah bacaan kondisi, bukan vonis. Setiap tangki menghasilkan kondisi untuk beberapa jenis alga pada suatu waktu. Pertanyaan yang berguna bukan "mengapa saya punya alga" tapi "apa yang sedang diungkapkan Environmental Rhythm sekarang."'] },

  // ══ aquarium-filter-maintenance ══════════════════════════════════════════════
  // mod-5: ARA · Technical Infrastructure (currently 2 hints → add as hintLabel3)

  { slug:'aquarium-filter-maintenance', lang:'ms', modIdx:4, hintN:3,
    label:'ARA · Infrastruktur Teknikal',
    text:['ARA mengenal pasti infrastruktur teknikal sebagai dimensi kapasiti keempat: sejauh mana automasi, sistem pemantauan, dan reka bentuk peralatan dapat melaksanakan fungsi penjagaan rutin secara boleh dipercayai. Peralatan yang difahami dengan baik dan diselenggara dengan betul memang meluaskan kapasiti penjaga. Namun, automasi yang dipasang tanpa pemahaman penjaga yang tulen menjadi sumber ketidakselarasan — apabila sistem gagal secara senyap atau menutup isyarat, infrastruktur yang sepatutnya menyokong sistem malah menghalang penjaga daripada maklumat yang mereka perlukan.'] },

  { slug:'aquarium-filter-maintenance', lang:'id', modIdx:4, hintN:3,
    label:'ARA · Infrastruktur Teknis',
    text:['ARA mengidentifikasi infrastruktur teknis sebagai dimensi kapasitas keempat: sejauh mana otomasi, sistem pemantauan, dan desain peralatan dapat melakukan fungsi perawatan rutin secara andal. Peralatan yang dipahami dengan baik dan dirawat dengan benar memang memperluas kapasitas penjaga. Namun, otomasi yang dipasang tanpa pemahaman penjaga yang tulus menjadi sumber ketidakselarasan — ketika sistem gagal secara diam-diam atau menyembunyikan sinyal, infrastruktur yang seharusnya mendukung sistem justru menghalangi penjaga dari informasi yang mereka butuhkan.'] },

  // ══ aquarium-maintenance-routine ═════════════════════════════════════════════
  // mod-4: Know Your Rhythm (currently 3 hints → add as hintLabel4)
  // Build script only supports hintLabel1-3. Since mod-4 already has 3,
  // we need to check — if it already has hintLabel3 we can't add more via current build.
  // SKIP — mod-4 already saturated at 3 hints in JSON (capacity limit of build script)

  // ══ aquarium-not-a-project ════════════════════════════════════════════════════
  // mod-4: ARA · Keeper Rhythm (currently 0 hints → add as hintLabel)

  { slug:'aquarium-not-a-project', lang:'ms', modIdx:3, hintN:1,
    label:'ARA · Keeper Rhythm',
    text:['Dorongan untuk terus memperbaiki tangki yang sudah stabil bukan kecacatan reka bentuk dalam diri penjaga — ia adalah rupa penjagaan apabila semua tugas yang diperlukan telah selesai. Tangki yang benar-benar selaras tidak meminta banyak. Bagi sesetengah penjaga, kesunyian itu menenangkan. Bagi yang lain, ia menghasilkan kecemasan tahap rendah bahawa ada sesuatu yang terlepas pandang, bahawa tangki boleh lebih baik, bahawa penjaga lain akan mendapati sesuatu untuk diperbaiki. Kecemasan itu adalah pembacaan Keeper Rhythm: ia cenderung muncul apabila hubungan penjaga dengan tangki dibina sekitar campur tangan aktif berbanding pemerhatian. Tangki yang sudah cukup memerlukan perhatian yang berbeza — satu yang memerhati tanpa perlu mencari sesuatu untuk diperbaiki.'] },

  { slug:'aquarium-not-a-project', lang:'id', modIdx:3, hintN:1,
    label:'ARA · Keeper Rhythm',
    text:['Dorongan untuk terus memperbaiki tangki yang sudah stabil bukan cacat desain pada penjaga — itu adalah tampilan kepedulian ketika semua tugas yang diperlukan telah selesai. Tangki yang benar-benar selaras tidak meminta banyak. Bagi beberapa penjaga, keheningan itu menenangkan. Bagi yang lain, itu menghasilkan kecemasan tingkat rendah bahwa ada sesuatu yang terlewat, bahwa tangki bisa lebih baik, bahwa penjaga lain akan menemukan sesuatu untuk diperbaiki. Kecemasan itu adalah bacaan Keeper Rhythm: cenderung muncul ketika hubungan penjaga dengan tangki dibangun di sekitar intervensi aktif daripada observasi. Tangki yang sudah cukup meminta perhatian yang berbeda — satu yang mengamati tanpa perlu menemukan sesuatu untuk diperbaiki.'] },

  // ══ aquarium-plants-not-growing ══════════════════════════════════════════════
  // mod-2: ARA · Environmental Rhythm (0 hints → add as hintLabel)
  // mod-3: ARA · Keeper Rhythm          (0 hints → add as hintLabel)

  { slug:'aquarium-plants-not-growing', lang:'ms', modIdx:1, hintN:1,
    label:'ARA · Environmental Rhythm',
    text:['Dalam ARA, Environmental Rhythm merangkumi semua yang organisma alami sebagai persekitarannya — bukan sahaja kimia air, tetapi kitaran cahaya, kestabilan suhu, ketersediaan CO2, dan struktur fizikal. Tumbuhan adalah sebahagian daripada ritma ini, bukan berasingan daripadanya. Apabila pertumbuhan tumbuhan adalah isyarat, Environmental Rhythm adalah hampir selalu tempat untuk melihat.'] },

  { slug:'aquarium-plants-not-growing', lang:'ms', modIdx:2, hintN:1,
    label:'ARA · Keeper Rhythm',
    text:['Memilih low-tech apabila anda menginginkan high-tech boleh terasa seperti berkompromi. Ia bukan. Penjaga yang membina tangki low-tech stabil yang berjalan dengan baik selama tiga tahun — di mana tumbuhan hidup dan sihat serta ikan jelas berasa selesa — telah melakukan sesuatu yang lebih sukar daripada banyak binaan high-tech: mereka telah memadankan ambisi mereka secara jujur kepada kapasiti sebenar mereka. Java fern yang tumbuh perlahan dan mantap bukan kompromi. Ia tanda sistem berfungsi.'] },

  { slug:'aquarium-plants-not-growing', lang:'id', modIdx:1, hintN:1,
    label:'ARA · Environmental Rhythm',
    text:['Dalam ARA, Environmental Rhythm mencakup segala yang dialami organisme sebagai lingkungannya — bukan hanya kimia air, tetapi siklus cahaya, stabilitas suhu, ketersediaan CO2, dan struktur fisik. Tanaman adalah bagian dari ritme ini, bukan terpisah darinya. Ketika pertumbuhan tanaman adalah sinyalnya, Environmental Rhythm hampir selalu menjadi tempat untuk dilihat.'] },

  { slug:'aquarium-plants-not-growing', lang:'id', modIdx:2, hintN:1,
    label:'ARA · Keeper Rhythm',
    text:['Memilih low-tech ketika Anda menginginkan high-tech bisa terasa seperti menyerah. Itu bukan. Penjaga yang membangun tangki low-tech stabil yang berjalan baik selama tiga tahun — di mana tanaman hidup dan sehat serta ikan jelas merasa nyaman — telah melakukan sesuatu yang lebih sulit dari banyak build high-tech: mereka telah mencocokkan ambisi mereka secara jujur dengan kapasitas aktual mereka. Java fern yang tumbuh lambat dan stabil bukan kompromi. Itu tanda sistem bekerja.'] },

  // ══ betta-fish-behaviour ══════════════════════════════════════════════════════
  // mod-4: ARA · Keeper Rhythm (currently 1 hint → add as hintLabel2)

  { slug:'betta-fish-behaviour', lang:'ms', modIdx:3, hintN:2,
    label:'ARA · Keeper Rhythm',
    text:['Betta dipelihara secara bersendirian, yang bermaksud setiap perubahan tingkah laku mendarat dengan cara yang berbeza berbanding tangki komuniti — tiada sekumpulan ikan untuk dibandingkan, tiada ikan lain yang tingkah laku normalnya memberikan konteks. Apabila betta berubah, penjaga perasan, dan keterikatan kepada ikan khusus itu bermaksud perasaan itu datang dengan berat. Berat itu nyata. Ia juga bermaksud bahawa keadaan penjaga — perhatian yang meningkat, kebimbangan tentang apa yang perubahan itu bermaksud, kedesakan untuk bertindak — adalah sebahagian daripada gambaran ekologi. Penjaga betta yang memeriksa parameter lebih kerap, mengganggu tangki lebih kerap, semasa tempoh kebimbangan adalah penjaga yang Ritmanya juga telah berubah. Baca kedua-duanya serentak.'] },

  { slug:'betta-fish-behaviour', lang:'id', modIdx:3, hintN:2,
    label:'ARA · Keeper Rhythm',
    text:['Betta dipelihara secara tunggal, yang berarti setiap perubahan perilaku terasa berbeda dari tangki komunitas — tidak ada sekolah untuk dibandingkan, tidak ada ikan lain yang perilaku normalnya memberikan konteks. Ketika betta berubah, penjaga memperhatikan, dan keterikatan pada ikan spesifik itu berarti perhatian itu datang dengan beban. Beban itu nyata. Ini juga berarti bahwa kondisi penjaga — perhatian yang meningkat, kecemasan tentang apa yang perubahan itu berarti, urgensi untuk bertindak — adalah bagian dari gambaran ekologi. Penjaga betta yang memeriksa parameter lebih sering, mengganggu tangki lebih sering, selama periode kekhawatiran adalah penjaga yang Ritmanya juga telah berubah. Baca keduanya sekaligus.'] },

  // ══ caring-without-guilt ══════════════════════════════════════════════════════
  // mod-2: ARA · Life Change Protocols (currently 1 hint → add as hintLabel2)
  // mod-4: In practice                 (currently 2 hints → add as hintLabel3)

  { slug:'caring-without-guilt', lang:'ms', modIdx:1, hintN:2,
    label:'ARA · Protokol Perubahan Hidup',
    text:['ARA mengiktiraf bahawa ritma penjagaan berubah apabila kehidupan berubah — pekerjaan baru, sakit, berpindah, musim yang sukar. Ia menamakan ini secara eksplisit sebagai protokol perubahan hidup: apabila kapasiti penjaga yang tersedia menurun dengan ketara, soalannya bukan bagaimana mengekalkan standard penjagaan sebelumnya dengan masa yang lebih sedikit. Ia bagaimana mengekalkan penjagaan minimum yang berkesan — ambang yang di bawahnya kestabilan sistem berisiko — sementara kehidupan penjaga menyusun semula. Ini adalah soalan rangka kerja, bukan soalan moral. Sistem yang direka bentuk untuk ritma penjaga yang realistik bertahan melalui tempoh sukar. Sistem yang direka bentuk untuk yang ideal sering tidak.'] },

  { slug:'caring-without-guilt', lang:'ms', modIdx:3, hintN:3,
    label:'Dalam amalan',
    text:['Kematangan dalam sistem datang dari masa dan kesinambungan, bukan kesempurnaan. Tangki yang dijaga dengan senyap — walaupun tidak sempurna — selama dua tahun sering mempunyai ketahanan yang jauh lebih besar daripada yang diuruskan secara intensif selama enam bulan.'] },

  { slug:'caring-without-guilt', lang:'id', modIdx:1, hintN:2,
    label:'ARA · Protokol Perubahan Hidup',
    text:['ARA mengakui bahwa ritme perawatan berubah ketika kehidupan berubah — pekerjaan baru, penyakit, pindahan, musim yang sulit. Ini dinamai secara eksplisit sebagai protokol perubahan hidup: ketika kapasitas penjaga yang tersedia turun secara signifikan, pertanyaannya bukan bagaimana mempertahankan standar perawatan sebelumnya dengan waktu lebih sedikit. Ini adalah bagaimana mempertahankan perawatan minimum yang efektif — ambang batas di bawahnya stabilitas sistem berisiko — sementara kehidupan penjaga menyusun ulang. Ini adalah pertanyaan kerangka kerja, bukan pertanyaan moral. Sistem yang dirancang untuk ritme penjaga yang realistis bertahan melalui periode sulit. Sistem yang dirancang untuk yang ideal sering tidak.'] },

  { slug:'caring-without-guilt', lang:'id', modIdx:3, hintN:3,
    label:'Dalam praktik',
    text:['Kematangan dalam sistem datang dari waktu dan kesinambungan, bukan kesempurnaan. Tangki yang dirawat dengan tenang — meskipun tidak sempurna — selama dua tahun sering memiliki ketahanan jauh lebih besar dari yang dikelola secara intensif selama enam bulan.'] },

  // ══ community-fish-tank ══════════════════════════════════════════════════════
  // mod-3: ARA · Keeper Rhythm (currently 1 hint → add as hintLabel2)

  { slug:'community-fish-tank', lang:'ms', modIdx:2, hintN:2,
    label:'ARA · Keeper Rhythm',
    text:['Salah satu pengalaman yang paling tidak selesa dalam memelihara tangki komuniti adalah melihat ikan yang anda sayangi semakin kurus atau semakin menyendiri, dan berasa tidak pasti sama ada harus campur tangan atau menunggu. Minggu pemerhatian yang diterangkan di atas boleh terasa seperti tidak melakukan apa-apa — tetapi ia sebenarnya perkara yang paling efisien dari segi maklumat yang boleh anda lakukan. Apa yang anda lihat pada akhir minggu itu adalah sesuatu yang carta keserasian tidak pernah dapat berikan: bagaimana kumpulan khusus ini, dalam tangki khusus ini, sebenarnya berkelakuan bersama.'] },

  { slug:'community-fish-tank', lang:'id', modIdx:2, hintN:2,
    label:'ARA · Keeper Rhythm',
    text:['Salah satu pengalaman yang paling tidak nyaman dalam memelihara tangki komunitas adalah melihat ikan yang Anda pedulikan semakin kurus atau semakin menarik diri, dan merasa tidak yakin apakah harus berintervasi atau menunggu. Minggu observasi yang dijelaskan di atas bisa terasa seperti tidak melakukan apa-apa — tapi sebenarnya itulah hal yang paling efisien secara informasi yang bisa Anda lakukan. Apa yang Anda lihat pada akhir minggu itu adalah sesuatu yang tidak pernah bisa diberikan oleh tabel kompatibilitas: bagaimana kelompok spesifik ini, di tangki spesifik ini, benar-benar berperilaku bersama.'] },

  // ══ fish-gasping-surface ══════════════════════════════════════════════════════
  // mod-3: ARA · Origin before Expression (currently 1 hint → add as hintLabel2)

  { slug:'fish-gasping-surface', lang:'ms', modIdx:2, hintN:2,
    label:'ARA · Asal sebelum Ekspresi',
    text:['Gasping adalah ekspresi. Filter yang semakin perlahan, air yang semakin panas, beban organik yang terkumpul yang menghasilkannya adalah asal. Prinsip penjajaran kelima ARA adalah Origin before Expression: tindak balas yang selaras bekerja ke belakang dari apa yang tangki tunjukkan kepada apa yang menghasilkannya. Agitasi permukaan membeli masa; mencari dan melaraskan asal mencegah berulang.'] },

  { slug:'fish-gasping-surface', lang:'id', modIdx:2, hintN:2,
    label:'ARA · Asal sebelum Ekspresi',
    text:['Gasping adalah ekspresinya. Filter yang melambat, air yang menghangat, beban organik yang menumpuk yang menghasilkannya adalah asal muasalnya. Prinsip penyelarasan kelima ARA adalah Origin before Expression: respons yang selaras bekerja mundur dari apa yang ditunjukkan tangki ke apa yang menghasilkannya. Agitasi permukaan membeli waktu; menemukan dan menyesuaikan asal mencegah kejadian berulang.'] },

  // ══ fish-hiding-what-does-it-mean ════════════════════════════════════════════
  // mod-4: Remember (currently 3 hints → add as hintLabel4 — over limit, use mod restructure)
  // Check actual hint count first

  { slug:'fish-hiding-what-does-it-mean', lang:'ms', modIdx:3, hintN:4,
    label:'Ingat',
    text:['Ikan tidak bersembunyi untuk menyampaikan tekanan. Mereka bersembunyi kerana persekitaran mereka meminta mereka melakukannya. Apabila anda mengubah persekitaran — apabila anda menghapus penyebab tekanan berbanding menutupnya — ikan mengikut. Begitulah cara Livestock Rhythm berfungsi: ia mencerminkan keadaan, bukan personaliti.'] },

  { slug:'fish-hiding-what-does-it-mean', lang:'id', modIdx:3, hintN:4,
    label:'Ingat',
    text:['Ikan tidak bersembunyi untuk menyampaikan tekanan. Mereka bersembunyi karena lingkungan mereka meminta mereka melakukannya. Ketika Anda mengubah lingkungan — ketika Anda menghilangkan stresor daripada menutupinya — ikan mengikuti. Itulah cara Livestock Rhythm bekerja: ia mencerminkan kondisi, bukan kepribadian.'] },

  // ══ fish-keep-dying-new-tank ══════════════════════════════════════════════════
  // mod-3: ARA · Keeper Rhythm (currently 3 hints → add as hintLabel4)

  { slug:'fish-keep-dying-new-tank', lang:'ms', modIdx:2, hintN:4,
    label:'ARA · Keeper Rhythm',
    text:['Kebanyakan daripada kita memasuki hobi ini dengan kepedulian lebih daripada yang kita sedar. Kehilangan ikan pada peringkat awal — terutama apabila anda telah berusaha sebaik mungkin — memang menyakitkan, dan rasa bersalah itu pun berat. Jika anda membaca ini selepas kehilangan: fakta bahawa anda cuba memahami apa yang berlaku adalah sendirinya attunement penjaga dalam bentuk awalnya. Itu lebih penting daripada apa yang berlaku dalam minggu pertama.'] },

  { slug:'fish-keep-dying-new-tank', lang:'id', modIdx:2, hintN:4,
    label:'ARA · Keeper Rhythm',
    text:['Sebagian besar dari kita memasuki hobi ini dengan kepedulian lebih dari yang kita ketahui. Kehilangan ikan di awal — terutama ketika Anda sudah berusaha sebaik mungkin — memang berat, dan rasa bersalahnya pun terasa berat. Jika Anda membaca ini setelah kehilangan: fakta bahwa Anda mencoba memahami apa yang terjadi itu sendiri adalah attunement penjaga dalam bentuk awalnya. Itu lebih penting dari apa yang terjadi di minggu pertama.'] },

  // ══ how-often-water-changes ══════════════════════════════════════════════════
  // mod-4: ARA · Keeper Rhythm (currently 2 hints → add as hintLabel3)

  { slug:'how-often-water-changes', lang:'ms', modIdx:3, hintN:3,
    label:'ARA · Keeper Rhythm',
    text:['Jumlah nasihat water change yang bercanggah — mingguan, dua minggu sekali, hanya apabila nitrat mencapai nombor tertentu, tidak pernah tanpa ujian — boleh menghasilkan kebimbangan khusus penjaga: perasaan bahawa anda sentiasa melakukan yang salah, bahawa jawapan yang betul wujud dan anda belum menemuinya lagi. Kebimbangan itu cenderung menghasilkan corak penjagaan yang paling mengganggu: perubahan besar yang tidak menentu dilakukan secara reaktif apabila ada yang kelihatan tidak kena, diselangi dengan tempoh panjang tidak bertindak. Ritma antara penjaga dan tangki lebih penting daripada kekerapan yang tepat. 15% yang jujur setiap sepuluh hari, dilakukan secara konsisten, menghasilkan lebih sedikit ketidakstabilan berbanding 30% aspirasi setiap minggu yang sebenarnya berlaku sekali sebulan.'] },

  { slug:'how-often-water-changes', lang:'id', modIdx:3, hintN:3,
    label:'ARA · Keeper Rhythm',
    text:['Volume saran water change yang saling bertentangan — mingguan, dua mingguan, hanya ketika nitrat mencapai angka tertentu, tidak pernah tanpa pengujian — dapat menghasilkan kecemasan khusus penjaga: perasaan bahwa Anda selalu melakukan yang salah, bahwa jawaban yang benar ada dan Anda belum menemukannya. Kecemasan itu cenderung menghasilkan pola perawatan yang paling mengganggu: perubahan besar yang tidak teratur dilakukan secara reaktif ketika sesuatu terlihat tidak beres, diselingi dengan periode panjang tanpa tindakan. Ritme antara penjaga dan tangki lebih penting dari frekuensi yang tepat. 15% yang jujur setiap sepuluh hari, dilakukan secara konsisten, menghasilkan lebih sedikit ketidakstabilan dari 30% aspirasional mingguan yang sebenarnya terjadi sebulan sekali.'] },

  // ══ ich-keeps-coming-back ════════════════════════════════════════════════════
  // mod-4: ARA · Intentional Phase Reset (currently 3 hints → add as hintLabel4)

  { slug:'ich-keeps-coming-back', lang:'ms', modIdx:3, hintN:4,
    label:'ARA · Tetapan Semula Fasa Bertujuan',
    text:['Tidak semua peralihan fasa menggambarkan kegagalan. Penjaga mungkin sengaja mereset sistem — untuk merawat penyakit berterusan, mengkonfigurasi semula persediaan, atau memulakan kitaran baru selepas crash. ARA membezakan tetapan semula fasa yang bertujuan daripada kemunduran yang didorong gangguan: tetapan semula adalah keputusan penjaga, bukan kerosakan sistem. Sistem melalui Fasa Awal sekali lagi, mengikut lengkung perkembangan yang sama — tetapi pengetahuan terkumpul penjaga membentuk bagaimana kitaran baru diuruskan.'] },

  { slug:'ich-keeps-coming-back', lang:'id', modIdx:3, hintN:4,
    label:'ARA · Reset Fase yang Disengaja',
    text:['Tidak semua transisi fase menggambarkan kegagalan. Seorang penjaga mungkin sengaja mereset sistem — untuk mengobati penyakit persisten, mengonfigurasi ulang pengaturan, atau memulai siklus baru setelah crash. ARA membedakan reset fase yang disengaja dari regresi yang didorong gangguan: reset adalah keputusan penjaga, bukan kerusakan sistem. Sistem melewati Early Phase lagi, mengikuti busur pengembangan yang sama — tetapi pengetahuan penjaga yang terkumpul membentuk cara siklus baru dikelola.'] },

  // ══ low-tech-planted-tank ════════════════════════════════════════════════════
  // mod-4: ARA · Technical Infrastructure (currently 2 hints → add as hintLabel3)

  { slug:'low-tech-planted-tank', lang:'ms', modIdx:3, hintN:3,
    label:'ARA · Infrastruktur Teknikal',
    text:['ARA mengenal pasti infrastruktur teknikal sebagai dimensi kapasiti keempat: sejauh mana automasi, sistem pemantauan, dan reka bentuk peralatan dapat melaksanakan fungsi penjagaan rutin secara boleh dipercayai. Peralatan yang difahami dengan baik dan diselenggara dengan betul memang meluaskan kapasiti penjaga. Namun, automasi yang dipasang tanpa pemahaman penjaga yang tulen menjadi sumber ketidakselarasan — apabila sistem gagal secara senyap atau menutup isyarat, infrastruktur yang sepatutnya menyokong sistem malah menghalang penjaga daripada maklumat yang mereka perlukan.'] },

  { slug:'low-tech-planted-tank', lang:'id', modIdx:3, hintN:3,
    label:'ARA · Infrastruktur Teknis',
    text:['ARA mengidentifikasi infrastruktur teknis sebagai dimensi kapasitas keempat: sejauh mana otomasi, sistem pemantauan, dan desain peralatan dapat melakukan fungsi perawatan rutin secara andal. Peralatan yang dipahami dengan baik dan dirawat dengan benar memang memperluas kapasitas penjaga. Namun, otomasi yang dipasang tanpa pemahaman penjaga yang tulus menjadi sumber ketidakselarasan — ketika sistem gagal secara diam-diam atau menyembunyikan sinyal, infrastruktur yang seharusnya mendukung sistem justru menghalangi penjaga dari informasi yang mereka butuhkan.'] },

  // ══ nitrate-keeps-rising ══════════════════════════════════════════════════════
  // mod-3: ARA · Origin before Expression (currently 2 hints → add as hintLabel3)

  { slug:'nitrate-keeps-rising', lang:'ms', modIdx:2, hintN:3,
    label:'ARA · Asal sebelum Ekspresi',
    text:['Nitrat yang meningkat adalah ekspresi. Hanyutan beransur-beransur dalam ketumpatan stok, kadar pemberian makan, atau liputan tumbuhan yang menghasilkannya adalah asal. Prinsip penjajaran kelima ARA adalah Origin before Expression: bacaan pada kit ujian memberitahu anda bahawa sesuatu sedang beroperasi dalam sistem — bukan apa yang perlu dilakukan, tetapi di mana hendak melihat. Kesan kembali dari angka kepada apa yang menghasilkannya.'] },

  { slug:'nitrate-keeps-rising', lang:'id', modIdx:2, hintN:3,
    label:'ARA · Asal sebelum Ekspresi',
    text:['Nitrat yang terus naik adalah ekspresinya. Pergeseran bertahap dalam kepadatan stok, laju pemberian makan, atau liputan tanaman yang menghasilkannya adalah asal muasalnya. Prinsip penyelarasan kelima ARA adalah Origin before Expression: bacaan pada kit uji memberi tahu Anda bahwa sesuatu sedang beroperasi dalam sistem — bukan apa yang harus dilakukan, tapi di mana harus melihat. Telusuri kembali dari angka ke apa yang menghasilkannya.'] },

  // ══ overfeeding-aquarium ══════════════════════════════════════════════════════
  // mod-4: ARA · Keeper Rhythm (currently 1 hint → add as hintLabel2)

  { slug:'overfeeding-aquarium', lang:'ms', modIdx:3, hintN:2,
    label:'ARA · Keeper Rhythm',
    text:['Mendapati bahawa pemberian makan berlebihan adalah pemacu kebanyakan masalah yang anda telah selesaikan selama berbulan-bulan boleh menghasilkan reaksi tertentu — rasa malu, atau bacaan kendiri yang tajam tentang apa yang sepatutnya anda ketahui. Reaksi itu wajar diperhatikan. Pemberian makan berlebihan adalah pemacu tidak kelihatan yang paling biasa bagi masalah akuarium bukan kerana penjaga tidak peduli, tetapi kerana memberi makan dengan murah hati terasa seperti menjaga dengan baik. Hubungan antara apa yang masuk dan apa yang terbawa dalam lajur air tidak intuitif sehingga anda membaca tangki cukup lama untuk melihat corak itu. Apa yang anda beri makan semalam adalah maklumat ekologi, bukan keputusan tentang kompetensi anda.'] },

  { slug:'overfeeding-aquarium', lang:'id', modIdx:3, hintN:2,
    label:'ARA · Keeper Rhythm',
    text:['Mengetahui bahwa pemberian makan berlebihan adalah pendorong sebagian besar masalah yang telah Anda pecahkan selama berbulan-bulan dapat menghasilkan reaksi tertentu — rasa malu, atau bacaan diri yang tajam tentang apa yang seharusnya Anda ketahui. Reaksi itu layak diperhatikan. Pemberian makan berlebihan adalah pendorong tak terlihat yang paling umum dari masalah akuarium bukan karena penjaga tidak peduli, tetapi karena memberi makan dengan murah hati terasa seperti merawat dengan baik. Hubungan antara apa yang masuk dan apa yang terbawa dalam kolom air tidak intuitif sampai Anda membaca tangki cukup lama untuk melihat polanya. Apa yang Anda beri makan kemarin adalah informasi ekologis, bukan vonis tentang kompetensi Anda.'] },

  // ══ perfect-parameters-fish-dying ═════════════════════════════════════════════
  // mod-1: ARA · Reading False Signals (currently 1 hint → add as hintLabel2)
  // mod-4: ARA · Keeper Rhythm          (currently 1 hint → add as hintLabel2)

  { slug:'perfect-parameters-fish-dying', lang:'ms', modIdx:0, hintN:2,
    label:'ARA · Membaca Isyarat Palsu',
    text:['ARA menamaikan ini sebagai isyarat palsu: bacaan yang tepat secara teknikal tetapi mengelirukan tentang keadaan sebenar sistem. Ammonia bersih bukan bukti bahawa tangki sihat — ia adalah bukti bahawa kitaran nitrogen sedang berjalan. Ikan yang merosot dalam air yang kelihatan bersih bukan misteri. Ia adalah sistem yang memberikan isyarat palsu di lapisan kit ujian sementara tekanan sebenar beroperasi di lapisan yang kit ujian tidak capai. Membaca isyarat palsu adalah amalan bertanya apa yang isyarat tidak sertakan, bukan sahaja apa yang ia tunjukkan.'] },

  { slug:'perfect-parameters-fish-dying', lang:'ms', modIdx:3, hintN:2,
    label:'ARA · Keeper Rhythm',
    text:['Ada rasa tidak berdaya yang khusus apabila menguji parameter yang sempurna sementara ikan semakin pudar. Kit ujian sepatutnya menjadi alat diagnostik — ia kata semuanya baik, namun sesuatu jelas tidak. Jurang antara apa yang angka katakan dan apa yang tangki luahkan boleh menyebabkan penjaga tidak mempercayai pemerhatian sendiri, mengulangi ujian kalau-kalau ada kesilapan, atau mencapai rawatan apabila tiada penyakit yang dikenal pasti. Kit ujian membaca kimia. Penjaga membaca ikan. Apabila kedua-dua isyarat bercanggah, ikan tidak salah. Sesuatu yang kit ujian tidak ukur sedang beroperasi — dan sesuatu itu boleh dijumpai melalui kaedah pemerhatian dalam panduan ini.'] },

  { slug:'perfect-parameters-fish-dying', lang:'id', modIdx:0, hintN:2,
    label:'ARA · Membaca Sinyal Palsu',
    text:['ARA menyebut ini sebagai sinyal palsu: bacaan yang secara teknis akurat tetapi menyesatkan tentang keadaan sistem yang sebenarnya. Amonia bersih bukan bukti bahwa tangki dalam kondisi baik — itu adalah bukti bahwa siklus nitrogen berjalan. Ikan yang menurun di air yang tampak bersih bukan misteri. Itu adalah sistem yang memberikan sinyal palsu di lapisan kit uji sementara tekanan sebenarnya beroperasi di lapisan yang tidak dapat dijangkau kit uji. Membaca sinyal palsu adalah praktik bertanya apa yang tidak disertakan sinyal, bukan hanya apa yang ditampilkannya.'] },

  { slug:'perfect-parameters-fish-dying', lang:'id', modIdx:3, hintN:2,
    label:'ARA · Keeper Rhythm',
    text:['Ada ketidakberdayaan khusus dalam menguji parameter sempurna sementara ikan memudar. Kit uji seharusnya menjadi alat diagnostik — ia mengatakan semuanya baik, namun sesuatu jelas tidak. Kesenjangan antara apa yang angka katakan dan apa yang tangki ekspresikan dapat membuat penjaga tidak mempercayai observasinya sendiri, mengulangi tes kalau-kalau ada kesalahan, atau mencapai pengobatan ketika tidak ada penyakit yang teridentifikasi. Kit uji membaca kimia. Penjaga membaca ikan. Ketika dua sinyal itu bertentangan, ikan tidak salah. Sesuatu yang tidak diukur kit uji sedang beroperasi — dan sesuatu itu dapat ditemukan melalui metode observasi dalam panduan ini.'] },

  // ══ shrimp-dying-aquarium ════════════════════════════════════════════════════
  // mod-4: ARA · Ecological Forgiveness (currently 3 hints → add as hintLabel4)

  { slug:'shrimp-dying-aquarium', lang:'ms', modIdx:3, hintN:4,
    label:'ARA · Kemaafan Ekologi',
    text:['Koloni udang pulih apabila penyebab tekanan utama dibuang dan persekitaran stabil. Jika koloni anda telah merosot tetapi yang terselamat masih aktif, tangki masih mempunyai ecological forgiveness yang tinggal. Buang penyebab tekanan utama, stabilkan air, dan tunggu enam hingga lapan minggu sebelum membuat kesimpulan bahawa tangki tidak sesuai.',
          'Pembiakan kembali berlaku sebelum semua tanda-tanda lain kesihatan koloni.'] },

  { slug:'shrimp-dying-aquarium', lang:'id', modIdx:3, hintN:4,
    label:'ARA · Pengampunan Ekologis',
    text:['Koloni udang pulih ketika stresor utama dihilangkan dan lingkungan stabil. Jika koloni Anda telah menurun tetapi yang bertahan masih aktif, tangki masih memiliki ecological forgiveness tersisa. Hilangkan stresor utama, stabilkan air, dan tunggu enam hingga delapan minggu sebelum menyimpulkan bahwa tangki tidak cocok.',
          'Pembiakan kembali terjadi sebelum semua tanda kesehatan koloni lainnya.'] },

  // ══ tank-crash-recovery ══════════════════════════════════════════════════════
  // mod-3: ARA · Intentional Phase Reset (currently 1 hint → add as hintLabel2)
  // mod-5: ARA · Keeper Rhythm           (currently 2 hints → add as hintLabel3)

  { slug:'tank-crash-recovery', lang:'ms', modIdx:2, hintN:2,
    label:'ARA · Tetapan Semula Fasa Bertujuan',
    text:['Tidak semua peralihan fasa menggambarkan kegagalan. Penjaga mungkin sengaja mereset sistem — untuk merawat penyakit berterusan, mengkonfigurasi semula persediaan, atau memulakan kitaran baru selepas crash. ARA membezakan tetapan semula fasa yang bertujuan daripada kemunduran yang didorong gangguan: tetapan semula adalah keputusan penjaga, bukan kerosakan sistem. Sistem melalui Fasa Awal sekali lagi, mengikut lengkung perkembangan yang sama — tetapi pengetahuan terkumpul penjaga membentuk bagaimana kitaran baru diuruskan.'] },

  { slug:'tank-crash-recovery', lang:'ms', modIdx:4, hintN:3,
    label:'ARA · Keeper Rhythm',
    text:['Jika anda membaca ini selepas crash: hakikat bahawa ia memberi kesan yang kuat bukan kelemahan. Ia adalah attunement yang sama yang menjadikan anda penjaga yang perasan perkara, peduli tentang haiwan, dan membina sesuatu selama berbulan-bulan. Attunement itu tidak hilang dalam crash — ia hanya menyakitkan sekarang. Apa pun keputusan anda tentang tangki seterusnya, anda sudah tahu lebih banyak tentang sistem akuatik berbanding sebelum ini. Pengetahuan itu kekal.'] },

  { slug:'tank-crash-recovery', lang:'id', modIdx:2, hintN:2,
    label:'ARA · Reset Fase yang Disengaja',
    text:['Tidak semua transisi fase menggambarkan kegagalan. Seorang penjaga mungkin sengaja mereset sistem — untuk mengobati penyakit persisten, mengonfigurasi ulang pengaturan, atau memulai siklus baru setelah crash. ARA membedakan reset fase yang disengaja dari regresi yang didorong gangguan: reset adalah keputusan penjaga, bukan kerusakan sistem. Sistem melewati Early Phase lagi, mengikuti busur pengembangan yang sama — tetapi pengetahuan penjaga yang terkumpul membentuk cara siklus baru dikelola.'] },

  { slug:'tank-crash-recovery', lang:'id', modIdx:4, hintN:3,
    label:'ARA · Keeper Rhythm',
    text:['Jika Anda membaca ini setelah crash: fakta bahwa itu menghantam Anda keras bukan kelemahan. Itu adalah attunement yang sama yang membuat Anda menjadi penjaga yang memperhatikan hal-hal, peduli dengan hewan, dan membangun sesuatu selama berbulan-bulan. Attunement itu tidak menghilang dalam crash — itu hanya menyakitkan sekarang. Apapun yang Anda putuskan tentang tangki selanjutnya, Anda sudah tahu lebih banyak tentang sistem akuatik dari sebelumnya. Pengetahuan itu tetap ada.'] },

  // ══ when-hobby-stops-feeling-good ════════════════════════════════════════════
  // mod-1: ARA · Keeper Rhythm         (ID: 0 hints → add as hintLabel)
  // mod-3: ARA · Ecological Forgiveness (ID: 0 hints → add as hintLabel)

  { slug:'when-hobby-stops-feeling-good', lang:'id', modIdx:0, hintN:1,
    label:'ARA · Keeper Rhythm',
    text:['Dalam ARA, Keeper Rhythm adalah ecological rhythm kelima — pola perhatian, waktu, energi, dan kapasitas emosional yang dibawa penjaga ke sistem. Ia tidak tetap. Ia berubah dengan musim, dengan keadaan hidup, dengan kesedihan, dengan kelelahan. Tangki yang berkelanjutan tahun lalu mungkin tidak berkelanjutan sekarang — bukan karena penjaga telah gagal, tetapi karena ritme penjaga telah berubah.'] },

  { slug:'when-hobby-stops-feeling-good', lang:'id', modIdx:2, hintN:1,
    label:'ARA · Pengampunan Ekologis',
    text:['Pengampunan ekologis berlaku pada penjaga, bukan hanya pada tangki. Penjaga yang telah berjuang, yang melewatkan water change, yang kehilangan ikan karena penyebab yang dapat dicegah — penjaga itu bukan penjaga yang buruk. Mereka adalah penjaga yang sistemnya hanyut melampaui keselarasan. Yang penting sekarang bukan sejarahnya tapi pilihan berikutnya.'] },

  // ══ when-is-tank-ready-for-fish ══════════════════════════════════════════════
  // mod-4: ARA · Capacity before Ambition (currently 2 hints → add as hintLabel3)

  { slug:'when-is-tank-ready-for-fish', lang:'ms', modIdx:3, hintN:3,
    label:'ARA · Kapasiti sebelum Ambisi',
    text:['Prinsip penjajaran ketiga ARA adalah Capacity before Ambition: tangki harus distok sebanding dengan apa yang biologi semasanya boleh tanggung — bukan apa yang akhirnya akan mampu ditanggungnya. Menambah ikan sebelum koloni mempunyai kapasiti untuk memproses sisa mereka mewujudkan tekanan kronik. Menambah kumpulan pertama, menunggu untuk mengesahkan sistem bertahan, dan mengembangkan dari situ bukan kehati-hatian — ia adalah membaca kapasiti sebenar sistem berbanding yang dimaksudkan.'] },

  { slug:'when-is-tank-ready-for-fish', lang:'id', modIdx:3, hintN:3,
    label:'ARA · Kapasitas sebelum Ambisi',
    text:['Prinsip penyelarasan ketiga ARA adalah Capacity before Ambition: tangki harus diisi sebanding dengan apa yang biologinya saat ini dapat ditanggung — bukan apa yang pada akhirnya akan mampu ditanggungnya. Menambahkan ikan sebelum koloni memiliki kapasitas untuk memproses limbah mereka menciptakan stres kronis. Menambahkan kelompok pertama, menunggu untuk mengkonfirmasi sistem bertahan, dan memperluas dari sana bukan kehati-hatian — itu adalah membaca kapasitas sistem yang sebenarnya daripada yang dimaksudkan.'] },

  // ══ why-is-my-aquarium-water-cloudy ══════════════════════════════════════════
  // mod-4: "If it is a new tank" (currently 4 hints → add as hintLabel5 — over limit)
  // Check actual count…

  { slug:'why-is-my-aquarium-water-cloudy', lang:'ms', modIdx:3, hintN:5,
    label:'Jika ini tangki baru',
    text:['Kekeruhan putih dalam tangki yang berusia kurang dari lapan minggu adalah hampir selalu bahagian normal daripada fasa permulaan biologi. Panduan tentang New Tank Syndrome menerangkan dengan tepat apa yang berlaku dan kenapa kesabaran adalah tindak balas yang paling selaras semasa tempoh ini.'] },

  { slug:'why-is-my-aquarium-water-cloudy', lang:'id', modIdx:3, hintN:5,
    label:'Jika ini tangki baru',
    text:['Kekeruhan putih dalam tangki yang berumur kurang dari delapan minggu hampir selalu merupakan bagian normal dari fase startup biologis. Panduan tentang New Tank Syndrome menjelaskan dengan tepat apa yang terjadi dan mengapa kesabaran adalah respons yang paling selaras selama periode ini.'] },

];

// ── Apply patches ─────────────────────────────────────────────────────────────

const HINT_KEYS = { 1:'hintLabel', 2:'hintLabel2', 3:'hintLabel3', 4:'hintLabel4', 5:'hintLabel5' };
const TEXT_KEYS = { 1:'hintText',  2:'hintText2',  3:'hintText3',  4:'hintText4',  5:'hintText5' };

let patched = 0;
let skipped = 0;

for (const p of PATCHES) {
  const fp = path.join(TRANS_DIR, p.lang, `${p.slug}.json`);
  if (!fs.existsSync(fp)) {
    process.stdout.write(`  [MISS] ${p.lang}/${p.slug}.json — file not found\n`);
    skipped++;
    continue;
  }

  const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
  if (!data.modules || !data.modules[p.modIdx]) {
    process.stdout.write(`  [MISS] ${p.lang}/${p.slug} — mod-${p.modIdx + 1} not found\n`);
    skipped++;
    continue;
  }

  const mod = data.modules[p.modIdx];
  const labelKey = HINT_KEYS[p.hintN];
  const textKey  = TEXT_KEYS[p.hintN];

  if (mod[labelKey]) {
    process.stdout.write(`  [SKIP] ${p.lang}/${p.slug} mod-${p.modIdx+1} ${labelKey} already exists\n`);
    skipped++;
    continue;
  }

  mod[labelKey] = p.label;
  mod[textKey]  = p.text;

  fs.writeFileSync(fp, JSON.stringify(data, null, 4), 'utf8');
  patched++;
  process.stdout.write(`  [OK]   ${p.lang}/${p.slug} mod-${p.modIdx+1} ${labelKey} added\n`);
}

console.log(`\nDone. ${patched} entries added, ${skipped} skipped.`);
