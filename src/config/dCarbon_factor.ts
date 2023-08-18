//------- Two methods to calculate the conversion factor of energy in mega-watt-hours to ton CO2 ----------
/**
 * Two methods to evaluate the WH_TO_TON_CO2:
 * 1. The calorific value of biogas (at Normal condition, 1atm) is approx. 21.6 MJ/m3
 * // ref: https://lpelc.org/biogas-utilization-and-cleanup/
 * - One ton of biogas at standard conditions (0C, 1atm) is approx 1200 m3
 *  --> generated_Energy = Calorific Value * Volume * Combustion Engine Efficiency * Generator Efficiency.
 *  --> generated_Energy = 21.6 MJ/m3 x 1200 m3 x 35% x 90%
 * - generated_Energy_in_WH = generated_Energy (MJ) x 10**6 / 3600 
 *  --> WH_TO_TON_CH4 = 1 / generated_Energy_in_WH  
 *  --> WH_TO_TON_CO2 = CH4_CO2_FACTOR / generated_Energy_in_WH. One ton CH4 equivalent to 28 ton CO2.
 * 
 * 2. CH4 + 2O2 → CO2 + 2H2O + 890.8 kJ/mole
 * - One ton CH4: TON_CH4_TO_MOLES = 10**6 (g) / 16 (g/mol) = ... (moles)
 * - TON_CH4_TO_KJ = TON_CH4_TO_MOLES * 890.8
 * - TON_CH4_TO_KWH = (TON_CH4_TO_KJ / 3600) * 35% * 90%
 */
const CH4_CO2_GWP = 28; // 1 ton CH4 equivalent to 28 ton CO2
const ICE_efficiency = 0.35 // 35%
const Generator_efficiency = 0.90 // 90%

/* Method 1: */
// Methane’s 100-year global warming potential (GWP) is about 28x CO2
function MWh_To_dCarbon_mth1() {
    const Calorific_Methane_MJ = 21.6; // MJ/m3
    const TON_BIOGAS_Volume = 1200; // m3 ???? !!!
    const CH4_concentration = 0.6; // 60%

    const generated_Energy_MJ = Calorific_Methane_MJ * TON_BIOGAS_Volume * ICE_efficiency * Generator_efficiency;
    const generated_Energy_MWH = generated_Energy_MJ / 3600
    const MWH_TO_TON_Biogas = 1 / generated_Energy_MWH; // 1 MWH to ton Biogas
    const MWH_TO_TON_CH4 = MWH_TO_TON_Biogas * CH4_concentration;
    const MWH_TO_TON_CO2 = MWH_TO_TON_CH4 * CH4_CO2_GWP;
    return MWH_TO_TON_CO2;
}
// CarbonCredit = 1 TON (GWP) CO2 = number_MWh x this_factor:
// console.log(`MWH_TO_TON_CO2: ${MWH_TO_TON_CO2}`); // ~= 7.4074

/* Method 2: */
function MWh_To_dCarbon_mth2() {
    const TON_CH4_TO_MOLES = 10 ** 6 / 16;
    const TON_CH4_TO_KJ = TON_CH4_TO_MOLES * 890.8;
    const TON_CH4_TO_KWH = (TON_CH4_TO_KJ / 3600) * ICE_efficiency * Generator_efficiency;
    const MWH_TO_TON_CO2_mth2 = 1000 * CH4_CO2_GWP / TON_CH4_TO_KWH;
    // console.log(`TON_CH4_TO_KJ: ${TON_CH4_TO_KJ}`);
    // console.log(`TON_CH4_TO_KWH: ${TON_CH4_TO_KWH}`);
    // console.log(`MWH_TO_TON_CO2: ${1000 * CH4_CO2_GWP / TON_CH4_TO_KWH}`); // ~= 5.7476
    return MWH_TO_TON_CO2_mth2;
}

export const MWH_TO_TON_C02 = MWh_To_dCarbon_mth2();