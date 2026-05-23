import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import { Gallery } from './pages/Gallery'
import { SandboxNav } from './components/SandboxNav'
import { DailyBudgetCardPalettePrototype } from './pages/DailyBudgetCardPalettePrototype'
import { HomePrototype } from './pages/HomePrototype'
import { CategoryTopABPrototype } from './pages/CategoryTopABPrototype'
import { AssetOutlookABPrototype } from './pages/AssetOutlookABPrototype'
import { AssetOutlookPcABPrototype } from './pages/AssetOutlookPcABPrototype'
import { PersonalSettingsPrototype } from './pages/PersonalSettingsPrototype'
import { PersonalSettingsBPrototype } from './pages/PersonalSettingsBPrototype'
import { MyPagePrototype } from './pages/MyPagePrototype'
import { PersonalSettingsEPrototype } from './pages/PersonalSettingsEPrototype'
import { MeisaiPrototype } from './pages/MeisaiPrototype'
import { ReportPrototype } from './pages/ReportPrototype'
import { StatusColorPalettePrototype } from './pages/StatusColorPalettePrototype'
import { SavingsForecastPalettePrototype } from './pages/SavingsForecastPalettePrototype'
import { TodayStatusPalettePrototype } from './pages/TodayStatusPalettePrototype'
import { CategoryColorPalettePrototype } from './pages/CategoryColorPalettePrototype'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SandboxNav />
      <Routes>
        <Route path="/" element={<Gallery />} />
        <Route path="/daily-budget-card-palette" element={<DailyBudgetCardPalettePrototype />} />
        <Route path="/home" element={<HomePrototype />} />
        <Route path="/category-ab" element={<CategoryTopABPrototype />} />
        <Route path="/asset-outlook-ab" element={<AssetOutlookABPrototype />} />
        <Route path="/asset-outlook-pc-ab" element={<AssetOutlookPcABPrototype />} />
        <Route path="/personal-settings"   element={<PersonalSettingsPrototype />} />
        <Route path="/settings-wizard"     element={<PersonalSettingsBPrototype />} />
        <Route path="/my-page" element={<MyPagePrototype />} />
        <Route path="/settings-e"          element={<PersonalSettingsEPrototype />} />
        <Route path="/meisai"              element={<MeisaiPrototype />} />
        <Route path="/report"              element={<ReportPrototype />} />
        <Route path="/status-color-palette" element={<StatusColorPalettePrototype />} />
        <Route path="/savings-forecast-palette" element={<SavingsForecastPalettePrototype />} />
        <Route path="/today-status-palette" element={<TodayStatusPalettePrototype />} />
        <Route path="/category-color-palette" element={<CategoryColorPalettePrototype />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
