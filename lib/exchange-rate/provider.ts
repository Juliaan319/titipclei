import { getStoredCnyRate } from "./get-cny-rate";
export interface ExchangeRate {baseCurrency:string;targetCurrency:string;marketRate:number}
export abstract class ExchangeRateProvider {abstract getRates(baseCurrency:string,targetCurrencies:string[]):Promise<ExchangeRate[]>;}
export class StoredExchangeRateProvider extends ExchangeRateProvider {
 async getRates(baseCurrency:string,targetCurrencies:string[]){if(baseCurrency!=="IDR"||targetCurrencies.some(c=>c!=="CNY"))throw new Error("Hanya kurs CNY/IDR yang didukung.");const rate=await getStoredCnyRate();if(!rate)throw new Error("Kurs belum tersedia. Perbarui kurs BI atau gunakan override manual.");return targetCurrencies.map(targetCurrency=>({baseCurrency,targetCurrency,marketRate:Number(rate.isManualOverride&&rate.manualRate?rate.manualRate:rate.marketRate)}));}
}
export function getExchangeRateProvider():ExchangeRateProvider{return new StoredExchangeRateProvider();}
