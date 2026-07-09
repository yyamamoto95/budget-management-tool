import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { Gallery } from './pages/Gallery'
import { ReceiptScanPrototype } from './pages/ReceiptScanPrototype'
import { SandboxNav } from './components/SandboxNav'
import { HomePrototype } from './pages/HomePrototype'
import { CategoryTopABPrototype } from './pages/CategoryTopABPrototype'
import { PersonalSettingsPrototype } from './pages/PersonalSettingsPrototype'
import { PersonalSettingsBPrototype } from './pages/PersonalSettingsBPrototype'
import { MyPagePrototype } from './pages/MyPagePrototype'
import { MeisaiPrototype } from './pages/MeisaiPrototype'
import { ReportPrototype } from './pages/ReportPrototype'
import { StatusColorPalettePrototype } from './pages/StatusColorPalettePrototype'
import { SavingsForecastPalettePrototype } from './pages/SavingsForecastPalettePrototype'
import { TodayStatusPalettePrototype } from './pages/TodayStatusPalettePrototype'
import { CategoryColorPalettePrototype } from './pages/CategoryColorPalettePrototype'
import { InvestmentCapacityPrototype } from './pages/InvestmentCapacityPrototype'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SandboxNav />
      <Routes>
        <Route path="/" element={<Gallery />} />
        <Route path="/home" element={<HomePrototype />} />
        <Route path="/category-ab" element={<CategoryTopABPrototype />} />
        <Route path="/personal-settings"   element={<PersonalSettingsPrototype />} />
        <Route path="/settings-wizard"     element={<PersonalSettingsBPrototype />} />
        <Route path="/my-page" element={<MyPagePrototype />} />
        <Route path="/records"             element={<MeisaiPrototype />} />
        <Route path="/report"              element={<ReportPrototype />} />
        <Route path="/status-color-palette" element={<StatusColorPalettePrototype />} />
        <Route path="/savings-forecast-palette" element={<SavingsForecastPalettePrototype />} />
        <Route path="/today-status-palette" element={<TodayStatusPalettePrototype />} />
        <Route path="/category-color-palette" element={<CategoryColorPalettePrototype />} />
        <Route path="/receipt-scan" element={<ReceiptScanPrototype />} />
        <Route path="/investment-capacity" element={<InvestmentCapacityPrototype />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
