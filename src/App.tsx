import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AuthGate from "./components/AuthGate";
import TopNav from "./components/TopNav";
import { AuthProvider } from "./context/AuthContext";
import { CharacterCdnCacheBustProvider } from "./context/CharacterCdnCacheBustContext";
import { CharacterBaseSetsProvider } from "./context/CharacterBaseSetsContext";
import { CreatorEquipmentProvider } from "./context/CreatorEquipmentContext";
import EquipmentSetDetail from "./pages/equipmentSets/EquipmentSetDetail";
import EquipmentSetsIndex from "./pages/equipmentSets/EquipmentSetsIndex";
import EquipmentSetsLayout from "./pages/equipmentSets/EquipmentSetsLayout";
import { EquipmentValidationProvider } from "./pages/equipmentSets/equipmentValidationContext";
import CharacterBasePartUpload from "./pages/CharacterBasePartUpload";
import EquipmentCharacterUpload from "./pages/EquipmentCharacterUpload";
import UploadLayout from "./pages/UploadLayout";
import CharacterSetDetail from "./pages/characterSets/CharacterSetDetail";
import CharacterSetsIndex from "./pages/characterSets/CharacterSetsIndex";
import CharacterSetsLayout from "./pages/characterSets/CharacterSetsLayout";
import Playground from "./pages/Playground";
import layoutClasses from "./styles/Layout.module.scss";

const App = () => {
  return (
    <AuthProvider>
      <CharacterCdnCacheBustProvider>
        <CreatorEquipmentProvider>
          <CharacterBaseSetsProvider>
            <BrowserRouter basename={process.env.PUBLIC_URL || ""}>
                  <AuthGate>
                    <EquipmentValidationProvider>
                    <div className={layoutClasses.shell}>
                      <TopNav />
                      <main className={layoutClasses.main}>
                        <Routes>
                          <Route path="/" element={<Playground />} />
                          <Route path="/upload" element={<UploadLayout />}>
                            <Route index element={<Navigate to="base-parts" replace />} />
                            <Route path="base-parts" element={<CharacterBasePartUpload />} />
                            <Route path="equipment" element={<EquipmentCharacterUpload />} />
                          </Route>
                          <Route path="/equipment-sets" element={<EquipmentSetsLayout />}>
                            <Route index element={<EquipmentSetsIndex />} />
                            <Route path=":equipSetId" element={<EquipmentSetDetail />} />
                          </Route>
                          <Route path="/character-sets" element={<CharacterSetsLayout />}>
                            <Route index element={<CharacterSetsIndex />} />
                            <Route path=":setId" element={<CharacterSetDetail />} />
                          </Route>
                        </Routes>
                      </main>
                    </div>
                    </EquipmentValidationProvider>
                  </AuthGate>
                </BrowserRouter>
          </CharacterBaseSetsProvider>
        </CreatorEquipmentProvider>
      </CharacterCdnCacheBustProvider>
    </AuthProvider>
  );
};

App.displayName = "App";

export default App;
