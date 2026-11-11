import React from 'react';
import { useLanguage } from '../i18n/index.js';
import {
  TrendingUp, DollarSign, Globe, ArrowUpRight, ShieldCheck, BarChart3
} from 'lucide-react';

const INSIGHTS = {
  en: [
    ['Bankura Terracotta Horses & Sculptures','West Bengal','High','Germany, USA, Domestic Urban'],
    ['Kanjivaram Handwoven Pure Silk','Tamil Nadu','Very High','UK, Singapore, Wedding Retail'],
    ['Channapatna Eco Wooden Toys','Karnataka','Surging','Montessori Schools, Scandinavia, Japan'],
    ['Moradabad Hand-Chiseled Brassware','Uttar Pradesh','Steady High','UAE, North America, Hospitality'],
    ['Jaipur Blue Pottery Glazed Ceramics','Rajasthan','High','Interior Designers, France, Australia']
  ],
  kn: [
    ['ಬಂಕುರಾ ಟೆರಾಕೋಟಾ ಕುದುರೆಗಳು ಮತ್ತು ಶಿಲ್ಪಗಳು','ಪಶ್ಚಿಮ ಬಂಗಾಳ','high','ಜರ್ಮನಿ, ಅಮೆರಿಕಾ, ಭಾರತದ ನಗರ ಮಾರುಕಟ್ಟೆ'],
    ['ಕಾಂಜೀವರಂ ಕೈಮಗ್ಗದ ಶುದ್ಧ ರೇಷ್ಮೆ','ತಮಿಳುನಾಡು','veryHigh','ಯುಕೆ, ಸಿಂಗಾಪುರ, ಮದುವೆ ಉಡುಪು ಮಾರುಕಟ್ಟೆ'],
    ['ಚನ್ನಪಟ್ಟಣದ ಪರಿಸರ ಸ್ನೇಹಿ ಮರದ ಆಟಿಕೆಗಳು','ಕರ್ನಾಟಕ','surging','ಮಾಂಟೆಸ್ಸೋರಿ ಶಾಲೆಗಳು, ಸ್ಕ್ಯಾಂಡಿನೇವಿಯಾ, ಜಪಾನ್'],
    ['ಮೊರಾದಾಬಾದ್ ಕೈಕೆತ್ತನೆಯ ಹಿತ್ತಾಳೆ ವಸ್ತುಗಳು','ಉತ್ತರ ಪ್ರದೇಶ','steadyHigh','ಯುಎಇ, ಉತ್ತರ ಅಮೆರಿಕಾ, ಆತಿಥ್ಯ ಕ್ಷೇತ್ರ'],
    ['ಜೈಪುರ ನೀಲಿ ಕುಂಬಾರಿಕೆಯ ಮೆರುಗು ಸೆರಾಮಿಕ್ ವಸ್ತುಗಳು','ರಾಜಸ್ಥಾನ','high','ಒಳಾಂಗಣ ವಿನ್ಯಾಸಕರು, ಫ್ರಾನ್ಸ್, ಆಸ್ಟ್ರೇಲಿಯಾ']
  ],
  hi: [
    ['बांकुरा टेराकोटा घोड़े और मूर्तियां','पश्चिम बंगाल','high','जर्मनी, अमेरिका, भारत के शहरी बाजार'],
    ['कांचीवरम हाथ से बुना शुद्ध रेशम','तमिलनाडु','veryHigh','ब्रिटेन, सिंगापुर, शादी के परिधान विक्रेता'],
    ['चन्नपटना के पर्यावरण-अनुकूल लकड़ी के खिलौने','कर्नाटक','surging','मोंटेसरी स्कूल, स्कैंडिनेविया, जापान'],
    ['मुरादाबाद की हाथ से उकेरी पीतल की वस्तुएं','उत्तर प्रदेश','steadyHigh','यूएई, उत्तरी अमेरिका, आतिथ्य क्षेत्र'],
    ['जयपुर की नीली मिट्टी के चमकदार सिरेमिक उत्पाद','राजस्थान','high','इंटीरियर डिजाइनर, फ्रांस, ऑस्ट्रेलिया']
  ],
  ta: [
    ['பாங்குரா டெரகோட்டா குதிரைகள் மற்றும் சிற்பங்கள்','மேற்கு வங்காளம்','high','ஜெர்மனி, அமெரிக்கா, இந்திய நகரச் சந்தை'],
    ['காஞ்சிபுரம் கைத்தறி தூய பட்டுப் புடவை','தமிழ்நாடு','veryHigh','இங்கிலாந்து, சிங்கப்பூர், திருமண ஆடை விற்பனை'],
    ['சன்னப்பட்டணா சுற்றுச்சூழலுக்கு உகந்த மர பொம்மைகள்','கர்நாடகம்','surging','மாண்டிசோரி பள்ளிகள், ஸ்காண்டிநேவியா, ஜப்பான்'],
    ['மொராதாபாத் கையால் செதுக்கிய பித்தளைப் பொருட்கள்','உத்தரப் பிரதேசம்','steadyHigh','ஐக்கிய அரபு அமீரகம், வட அமெரிக்கா, விருந்தோம்பல் துறை'],
    ['ஜெய்ப்பூர் நீல மட்பாண்ட மெருகூட்டிய செராமிக் பொருட்கள்','ராஜஸ்தான்','high','உள் அலங்கார வடிவமைப்பாளர்கள், பிரான்ஸ், ஆஸ்திரேலியா']
  ],
  te: [
    ['బంకురా టెర్రకోట గుర్రాలు మరియు శిల్పాలు','పశ్చిమ బెంగాల్','high','జర్మనీ, అమెరికా, భారత పట్టణ మార్కెట్'],
    ['కాంచీపురం చేతితో నేసిన స్వచ్ఛమైన పట్టు','తమిళనాడు','veryHigh','యూకే, సింగపూర్, వివాహ వస్త్రాల విక్రేతలు'],
    ['చన్నపట్నం పర్యావరణహిత చెక్క బొమ్మలు','కర్ణాటక','surging','మాంటిస్సోరి పాఠశాలలు, స్కాండినేవియా, జపాన్'],
    ['మొరాదాబాద్ చేతితో చెక్కిన ఇత్తడి వస్తువులు','ఉత్తరప్రదేశ్','steadyHigh','యూఏఈ, ఉత్తర అమెరికా, ఆతిథ్య రంగం'],
    ['జైపూర్ నీలి కుండల మెరుగు సిరామిక్ వస్తువులు','రాజస్థాన్','high','ఇంటీరియర్ డిజైనర్లు, ఫ్రాన్స్, ఆస్ట్రేలియా']
  ],
  ml: [
    ['ബങ്കുര ടെറാക്കോട്ട കുതിരകളും ശിൽപ്പങ്ങളും','പശ്ചിമ ബംഗാൾ','high','ജർമ്മനി, അമേരിക്ക, ഇന്ത്യയിലെ നഗര വിപണി'],
    ['കാഞ്ചീപുരം കൈത്തറി ശുദ്ധമായ പട്ട്','തമിഴ്നാട്','veryHigh','യുകെ, സിംഗപ്പൂർ, വിവാഹ വസ്ത്ര വ്യാപാരം'],
    ['ചന്നപട്ടണ പരിസ്ഥിതി സൗഹൃദ മരപ്പാവകൾ','കർണാടക','surging','മോണ്ടിസോറി സ്കൂളുകൾ, സ്കാൻഡിനേവിയ, ജപ്പാൻ'],
    ['മൊറാദാബാദ് കൈകൊണ്ട് കൊത്തിയ പിച്ചള വസ്തുക്കൾ','ഉത്തർപ്രദേശ്','steadyHigh','യുഎഇ, വടക്കേ അമേരിക്ക, ഹോസ്പിറ്റാലിറ്റി മേഖല'],
    ['ജയ്പൂർ നീല മൺപാത്ര ഗ്ലേസ്ഡ് സെറാമിക് വസ്തുക്കൾ','രാജസ്ഥാൻ','high','ഇന്റീരിയർ ഡിസൈനർമാർ, ഫ്രാൻസ്, ഓസ്ട്രേലിയ']
  ]
};

const GROWTH = ['+42%', '+38%', '+54%', '+29%', '+35%'];
const PRICES = ['₹1,800 – ₹4,500', '₹12,000 – ₹35,000', '₹950 – ₹2,400', '₹2,500 – ₹7,800', '₹1,400 – ₹3,900'];

export default function MarketInsights() {
  const { t, lang } = useLanguage();
  const text = t.insights || {};
  const rows = INSIGHTS[lang] || INSIGHTS.en;
  const demandLabels = { high: text.high, veryHigh: text.veryHigh, surging: text.surging, steadyHigh: text.steadyHigh };
  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">{text.title}</h1><p className="page-subtitle">{text.desc}</p></div></div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon" style={{ background: '#fef3c7', color: '#d97706' }}><TrendingUp size={24} /></div><div><div className="stat-val">+41.8%</div><div className="stat-lbl">{text.giDemand}</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}><DollarSign size={24} /></div><div><div className="stat-val">2.8x</div><div className="stat-lbl">{text.earnings}</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}><Globe size={24} /></div><div><div className="stat-val">34+</div><div className="stat-lbl">{text.exportCountries}</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}><ShieldCheck size={24} /></div><div><div className="stat-val">100%</div><div className="stat-lbl">{text.settlements}</div></div></div>
      </div>
      <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '1px solid #fed7aa' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div><h3 style={{ fontSize: '1.25rem', color: '#9a3412', marginBottom: '0.25rem' }}>💡 {text.benchmark}</h3><p style={{ fontSize: '0.92rem', color: '#7c2d12', maxWidth: '720px' }}>{text.benchmarkDesc}</p></div>
          <div style={{ background: 'white', padding: '0.75rem 1.25rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}><span style={{ fontSize: '0.75rem', color: '#9a3412', fontWeight: 700, textTransform: 'uppercase' }}>{text.margin}</span><div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#c2410c' }}>+62%</div></div>
        </div>
      </div>
      <div className="card">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BarChart3 size={20} color="var(--primary)" /><span>{text.topCrafts}</span></h3>
        <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.92rem' }}>
          <thead><tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}><th style={{ padding: '0.75rem' }}>{text.category}</th><th style={{ padding: '0.75rem' }}>{text.region}</th><th style={{ padding: '0.75rem' }}>{text.growth}</th><th style={{ padding: '0.75rem' }}>{text.intensity}</th><th style={{ padding: '0.75rem' }}>{text.fairPrice}</th><th style={{ padding: '0.75rem' }}>{text.buyers}</th></tr></thead>
          <tbody>{rows.map((row, i) => <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', background: i % 2 === 0 ? 'rgba(250, 248, 245, 0.5)' : 'white' }}>
            <td style={{ padding: '1rem 0.75rem', fontWeight: 600 }}>{row[0]}</td><td style={{ padding: '1rem 0.75rem', color: 'var(--text-muted)' }}>{row[1]}</td>
            <td style={{ padding: '1rem 0.75rem', color: '#059669', fontWeight: 700 }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}><ArrowUpRight size={15} />{GROWTH[i]}</span></td>
            <td style={{ padding: '1rem 0.75rem' }}><span style={{ padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 700, background: '#ecfdf5', color: '#065f46' }}>{demandLabels[row[2]] || row[2]}</span></td>
            <td style={{ padding: '1rem 0.75rem', fontWeight: 600, color: 'var(--primary)' }}>{PRICES[i]}</td><td style={{ padding: '1rem 0.75rem', color: '#4b5563' }}>{row[3]}</td>
          </tr>)}</tbody>
        </table></div>
      </div>
    </div>
  );
}
