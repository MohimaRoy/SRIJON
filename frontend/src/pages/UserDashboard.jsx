// Dashboard.jsx — blue gradient theme (logic unchanged)
import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaEdit, FaCheckCircle, FaDraftingCompass, FaFilePdf, FaIndustry, FaBoxOpen, FaChartLine, FaUserTie, FaLock, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import ProfilePicture from '../components/ProfilePicture';

const VisualGallery = lazy(() => import('../components/VisualGallery'));
const GalleryFallback = () => (
  <div className="bg-white/80 rounded-2xl shadow-sm border border-blue-100 p-12 flex justify-center">
    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
  </div>
);

const UserDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [businessData, setBusinessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isProductShowcaseComplete, setIsProductShowcaseComplete] = useState(false);
  const [missingItems, setMissingItems] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    fetchBusinessData();
    const handleDataUpdate = (event) => { if (event.detail) { setBusinessData(event.detail); setLoading(false); } };
    window.addEventListener('business-data-updated', handleDataUpdate);
    return () => { window.removeEventListener('business-data-updated', handleDataUpdate); if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
  }, []);

  const fetchBusinessData = async () => {
    try {
      const response = await api.get('/business');
      if (response.data.success) {
        setBusinessData(response.data.data);
        const pct = response.data.completionPercentage ?? 0;
        const showcase = response.data.isProductShowcaseComplete ?? false;
        const missing = response.data.missingItems ?? [];
        setCompletionPercentage(pct);
        setIsProductShowcaseComplete(showcase);
        setMissingItems(missing);
        if (pct < 80 || !showcase) { setShowToast(true); toastTimerRef.current = setTimeout(() => setShowToast(false), 8000); }
      }
    } catch (error) { console.error('Error fetching business data:', error); }
    finally { setLoading(false); }
  };

  const isSectionMissing = (keyword) => missingItems.some(item => item.toLowerCase().includes(keyword.toLowerCase()));
  const canDownload = completionPercentage >= 80 && isProductShowcaseComplete;

  const getTooltipText = () => {
    if (completionPercentage < 80 && !isProductShowcaseComplete) return 'Complete ≥80% of your profile and add product images to unlock.';
    if (completionPercentage < 80) return `Complete at least 80% of your profile (currently ${completionPercentage}%).`;
    return 'Add product images, name, description and wholesale price to unlock.';
  };

  const downloadPDF = async () => {
    if (!canDownload) return;
    try {
      const response = await api.get('/business/download-pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url; link.setAttribute('download', `SRIJON_Profile_${user?.name.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link); link.click(); link.remove();
    } catch (error) { console.error('Error downloading PDF:', error); alert('Failed to download PDF.'); }
  };

  const DashInfoItem = ({ label, value }) => <InfoItem label={label} value={value} notProvided={t('dashboard.notProvided')} />;

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50/30">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-blue-600 font-medium">{t('dashboard.loading')}</p>
        </div>
      </div>
      <Footer />
    </div>
  );

  if (!businessData) {

    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50/30">
        <Navbar />
        <div className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <div className="max-w-2xl w-full text-center bg-white/80 backdrop-blur-sm p-12 rounded-3xl shadow-xl shadow-blue-100/50 border border-blue-100">
            <div className="w-20 h-20 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6"><FaDraftingCompass size={32} /></div>
            <h2 className="text-3xl font-bold text-slate-800 mb-4">{t('dashboard.welcome')}</h2>
            <p className="text-slate-600 mb-8 text-lg">{t('dashboard.noDataMessage')}</p>
            <button onClick={() => navigate('/agreement')} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-300/30 hover:shadow-blue-400/40 transform hover:-translate-y-1">{t('dashboard.startWizard')}</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50/30 font-sans">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 md:px-6 py-6 space-y-5">

        {/* Toast */}
        {showToast && (
          <div className="flex items-start gap-3 bg-red-50 border-2 border-red-200 text-red-800 px-5 py-4 rounded-2xl shadow animate-fade-in">
            <FaExclamationTriangle className="mt-0.5 flex-shrink-0 text-red-400 text-xl" />
            <div className="flex-1">
              <p className="font-bold text-sm">{t('dashboard.toast.title')}</p>
              <p className="text-xs mt-1 leading-relaxed">
                {t('dashboard.toast.message')} <strong>80%</strong>{' '}
                ({t('dashboard.profileCompletion')}{' '}
                <strong className={completionPercentage >= 80 ? 'text-green-600' : 'text-red-600'}>{completionPercentage}%</strong>){' '}
                {t('dashboard.toast.and')} <strong>{t('dashboard.toast.uploadPhotos')}</strong>.{' '}
                <span className="underline font-semibold">{t('dashboard.toast.checkRedSections')}</span>
              </p>
            </div>
            <button onClick={() => { setShowToast(false); clearTimeout(toastTimerRef.current); }} className="text-red-400 hover:text-red-600 ml-auto flex-shrink-0"><FaTimes /></button>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm shadow-blue-100/50 border border-blue-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800">{t('dashboard.title')}</h1>
            {businessData.submissionStatus === 'submitted' ? (
              <span className="bg-blue-100 text-blue-600 border border-blue-200 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1"><FaCheckCircle /> {t('dashboard.status.active')}</span>
            ) : (
              <span className="bg-amber-100 text-amber-600 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1"><FaDraftingCompass /> {t('dashboard.status.draft')}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <button onClick={downloadPDF} disabled={!canDownload}
                className={`flex flex-col items-center justify-center gap-0.5 px-4 py-2 rounded-xl border transition-all text-xs font-semibold min-w-[80px]
                  ${canDownload ? 'bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 cursor-pointer' : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'}`}>
                {canDownload ? <FaFilePdf className="text-2xl text-blue-500" /> : <FaLock className="text-2xl text-slate-400" />}
                <span className="leading-tight text-center">{t('dashboard.buttons.downloadPDF')}</span>
              </button>
              {!canDownload && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 text-center">
                  {getTooltipText()}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45 -mt-1" />
                </div>
              )}
            </div>
            <button onClick={() => navigate('/wizard', { state: { editMode: true } })}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all shadow shadow-blue-300/30 text-sm font-bold whitespace-nowrap">
              <FaEdit /> {t('dashboard.buttons.editProfile')}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm shadow-blue-100/50 border border-blue-100 px-6 py-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-slate-600">{t('dashboard.profileCompletion')}</span>
            <span className={`text-sm font-bold ${completionPercentage >= 80 ? 'text-blue-600' : 'text-amber-500'}`}>{completionPercentage}%</span>
          </div>
          <div className="w-full h-3 bg-blue-50 rounded-full overflow-hidden border border-blue-100">
            <div className={`h-full rounded-full transition-all duration-700 ${completionPercentage >= 80 ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gradient-to-r from-amber-400 to-orange-400'}`} style={{ width: `${completionPercentage}%` }} />
          </div>
          {completionPercentage < 80 && <p className="text-xs text-blue-400 mt-1.5">{t('dashboard.progressHint')}</p>}
        </div>

        {/* Profile + Owner Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm shadow-blue-100/50 border border-blue-100 p-6 flex flex-col items-center justify-center gap-3">
            <ProfilePicture user={user} onUpdate={fetchBusinessData} />
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-800">{businessData.brandName || t('dashboard.myBrand')}</h3>
              <p className="text-sm text-slate-500">{businessData.ownerName || '—'}</p>
              <p className="text-xs text-blue-400 mt-1">{t('dashboard.welcomeUser')}{user?.name}</p>
            </div>
          </div>

          <div className="md:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm shadow-blue-100/50 border border-blue-100 overflow-hidden">
            <SectionHeader icon={<FaUserTie />} title={t('dashboard.sections.ownerInformation')} />
            <div className="p-6 grid grid-cols-2 gap-x-10 gap-y-4">
              <DashInfoItem label={t('dashboard.labels.ownerName')} value={businessData.ownerName} />
              <DashInfoItem label={t('dashboard.labels.gender')} value={businessData.gender} />
              <DashInfoItem label={t('dashboard.labels.age')} value={businessData.ownerAge} />
              <DashInfoItem label={t('dashboard.labels.ownershipType')} value={businessData.ownershipType} />
              <DashInfoItem label={t('dashboard.labels.partnerName')} value={businessData.partnerName} />
              <DashInfoItem label={t('dashboard.labels.mobile')} value={businessData.mobileNumber ? `+880 ${businessData.mobileNumber}` : null} />
              <DashInfoItem label={t('dashboard.labels.email')} value={businessData.email} />
              <DashInfoItem label={t('dashboard.labels.whatsApp')} value={businessData.whatsappNumber} />
              <DashInfoItem label={t('dashboard.labels.division')} value={businessData.division} />
              <DashInfoItem label={t('dashboard.labels.district')} value={businessData.district} />
              <DashInfoItem label={t('dashboard.labels.thana')} value={businessData.thana} />
              <DashInfoItem label={t('dashboard.labels.postCode')} value={businessData.postCode} />
              <div className="col-span-2"><DashInfoItem label={t('dashboard.labels.detailedAddress')} value={businessData.detailedAddress} /></div>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ${isSectionMissing('product showcase') ? 'border-2 border-red-300 ring-2 ring-red-100 shadow-red-100/30' : 'border border-blue-100 shadow-blue-100/50'}`}>
          <SectionHeader icon={<FaBoxOpen />} title={t('dashboard.sections.productProduction')} warning={isSectionMissing('product showcase')} incompleteLabel={t('dashboard.incomplete')} />
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-5">
              <DashInfoItem label={t('dashboard.labels.productName')} value={businessData.productName} />
              <DashInfoItem label={t('dashboard.labels.brandName')} value={businessData.brandName} />
              <DashInfoItem label={t('dashboard.labels.category')} value={businessData.category} />
              <DashInfoItem label={t('dashboard.labels.productType')} value={businessData.productType} />
              <DashInfoItem label={t('dashboard.labels.wholesalePrice')} value={businessData.wholesalePrice ? `৳${businessData.wholesalePrice}` : null} />
              <DashInfoItem label={t('dashboard.labels.retailPrice')} value={businessData.retailPrice ? `৳${businessData.retailPrice}` : null} />
              <DashInfoItem label={t('dashboard.labels.moq')} value={businessData.moq} />
              <DashInfoItem label={t('dashboard.labels.bulkDiscount')} value={businessData.bulkDiscount} />
              <DashInfoItem label={t('dashboard.labels.productionType')} value={businessData.productionType} />
              <DashInfoItem label={t('dashboard.labels.rawMaterial')} value={businessData.rawMaterialSource} />
              <DashInfoItem label={t('dashboard.labels.place')} value={businessData.productionPlace} />
              <DashInfoItem label={t('dashboard.labels.capacity')} value={businessData.productionCapacity} />
              <DashInfoItem label={`${t('dashboard.labels.male')} ${t('dashboard.labels.workforce')}`} value={businessData.maleWorkers} />
              <DashInfoItem label={`${t('dashboard.labels.female')} ${t('dashboard.labels.workforce')}`} value={businessData.femaleWorkers} />
            </div>
            {businessData.shortDescription && (
              <div className="mt-5 p-4 bg-blue-50/40 rounded-xl border border-blue-100">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">{t('dashboard.labels.productDescription')}</p>
                <p className="text-sm text-slate-700 leading-relaxed">{businessData.shortDescription}</p>
              </div>
            )}
          </div>
        </div>

        {/* Market & Business Status */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm shadow-blue-100/50 border border-blue-100 overflow-hidden">
          <SectionHeader icon={<FaChartLine />} title={t('dashboard.sections.marketStatus')} />
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-5">
              <DashInfoItem label={t('dashboard.metrics.businessAge')} value={businessData.businessAge ? `${businessData.businessAge} ${t('dashboard.years')}` : null} />
              <DashInfoItem label={t('dashboard.metrics.monthlySales')} value={businessData.monthlySales ? `৳${businessData.monthlySales}` : null} />
              <DashInfoItem label={t('dashboard.metrics.totalCustomers')} value={businessData.totalCustomers} />
              <DashInfoItem label={t('dashboard.labels.regularCustomers')} value={businessData.regularCustomers} />
              <DashInfoItem label={t('dashboard.labels.exportInterest')} value={businessData.interestInOnlineExport} />
              <DashInfoItem label={t('dashboard.labels.bankAccount')} value={businessData.hasBankAccount} />
              <DashInfoItem label={t('dashboard.labels.bankName')} value={businessData.bankName} />
              <DashInfoItem label={t('dashboard.labels.accountNumber')} value={businessData.accountNumber} />
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-blue-50/40 rounded-xl p-4 border border-blue-100">
                <p className="text-xs font-bold text-blue-500 uppercase mb-2">{t('dashboard.futureGoals.title')}</p>
                <p className="text-sm text-slate-700 leading-relaxed">{businessData.futureGoals || t('dashboard.futureGoals.noGoals')}</p>
              </div>
              <div className="flex flex-wrap gap-2 content-start pt-1">
                {businessData.interestInOnlineExport && <Badge text={t('dashboard.badges.exportInterest')} />}
                {businessData.needFunding && <Badge text={t('dashboard.badges.needFunding')} />}
                {businessData.needTraining && <Badge text={t('dashboard.badges.needTraining')} />}
              </div>
            </div>
          </div>
        </div>

        {/* Visual Gallery */}
        <div className={`rounded-2xl overflow-hidden transition-all duration-300 ${isSectionMissing('gallery') ? 'ring-2 ring-red-300 ring-offset-2' : ''}`}>
          {isSectionMissing('gallery') && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-bold px-4 py-2 rounded-t-2xl">
              <FaExclamationTriangle />{t('dashboard.toast.galleryImagesMissing')}
            </div>
          )}
          <Suspense fallback={<GalleryFallback />}>
            <VisualGallery onUpdate={fetchBusinessData} />
          </Suspense>
        </div>

      </div>
      <Footer />
    </div>
  );
};

const SectionHeader = ({ icon, title, warning, incompleteLabel }) => (
  <div className={`px-6 py-4 border-b flex items-center gap-2.5 ${warning ? 'bg-red-50 border-red-200' : 'bg-blue-50/30 border-blue-100'}`}>
    <span className={`text-lg ${warning ? 'text-red-400' : 'text-blue-400'}`}>{icon}</span>
    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wide">{title}</h3>
    {warning && (
      <span className="ml-auto inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
        <FaExclamationTriangle className="text-xs" /> {incompleteLabel}
      </span>
    )}
  </div>
);

const InfoItem = ({ label, value, notProvided }) => (
  <div>
    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-0.5">{label}</p>
    <p className="text-sm font-semibold text-slate-700">{value || <span className="text-blue-200 font-normal italic">{notProvided}</span>}</p>
  </div>
);

const Badge = ({ text }) => (
  <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1.5 rounded-full border border-blue-200 font-semibold">{text}</span>
);

export default UserDashboard;
