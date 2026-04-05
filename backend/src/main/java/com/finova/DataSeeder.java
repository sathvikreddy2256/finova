package com.finova;

import com.finova.model.InsurancePlan;
import com.finova.model.MarketOption;
import com.finova.repository.InsurancePlanRepository;
import com.finova.repository.MarketOptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DataSeeder — seeds MarketOptions and InsurancePlans on first startup.
 * Only inserts if the tables are empty (idempotent).
 * Uses realistic Indian market prices — NO random values.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final MarketOptionRepository marketRepo;
    private final InsurancePlanRepository insuranceRepo;

    @Override
    public void run(String... args) {
        seedMarketOptions();
        seedInsurancePlans();
    }

    // ─── Market Options ───────────────────────────────────────────────────────

    private void seedMarketOptions() {
        if (marketRepo.count() > 0) {
            log.info("Market options already seeded — skipping.");
            return;
        }
        log.info("Seeding market options...");
        LocalDateTime now = LocalDateTime.now();

        // LARGE CAP
        marketRepo.save(build("Nifty 50 Index Fund", "LARGE_CAP", "N50", "23485.40", "23187.80", "18.2", "LOW", "Tracks Nifty 50 — India's benchmark index. Lowest cost large-cap exposure.", "ICICI Pru / Nippon India", now));
        marketRepo.save(build("Mirae Asset Large Cap Fund", "LARGE_CAP", "MALCF", "105.32", "103.95", "17.8", "LOW", "Top-rated large cap fund with consistent outperformance over 10 years.", "Mirae Asset", now));
        marketRepo.save(build("Axis Bluechip Fund", "LARGE_CAP", "AXBLU", "58.91", "58.12", "15.4", "LOW", "Quality-focused large cap fund. Holds blue-chip companies only.", "Axis MF", now));

        // MID CAP
        marketRepo.save(build("HDFC Mid Cap Opportunities", "MID_CAP", "HDMCO", "145.62", "142.31", "24.5", "MEDIUM", "India's largest mid-cap fund by AUM. 10+ year track record.", "HDFC MF", now));
        marketRepo.save(build("Kotak Emerging Equity Fund", "MID_CAP", "KEEF", "102.45", "99.80", "26.1", "MEDIUM", "Focuses on emerging mid-cap companies with high growth potential.", "Kotak MF", now));
        marketRepo.save(build("Nippon India Growth Fund", "MID_CAP", "NIGF", "3452.80", "3380.50", "22.8", "MEDIUM", "One of India's oldest mid-cap funds. Diversified mid-cap exposure.", "Nippon India", now));

        // SMALL CAP
        marketRepo.save(build("Nippon India Small Cap Fund", "SMALL_CAP", "NISCF", "178.90", "174.20", "31.2", "HIGH", "India's largest small cap fund. High growth, high volatility.", "Nippon India", now));
        marketRepo.save(build("Quant Small Cap Fund", "SMALL_CAP", "QSMCF", "234.15", "227.80", "38.7", "HIGH", "Quant-driven small cap strategy. High performer but volatile.", "Quant MF", now));
        marketRepo.save(build("SBI Small Cap Fund", "SMALL_CAP", "SBISCF", "142.60", "139.40", "28.9", "HIGH", "Established small cap fund with strong long-term track record.", "SBI MF", now));

        // GOLD
        marketRepo.save(build("Nippon India Gold ETF", "GOLD", "GOLDBEES", "6245.00", "6198.50", "14.3", "LOW", "Physical gold ETF. Tracks domestic gold price. Inflation hedge.", "Nippon India", now));
        marketRepo.save(build("SBI Gold Fund", "GOLD", "SBIGOLD", "21.85", "21.62", "14.1", "LOW", "Fund-of-fund investing in SBI Gold ETF. No demat account needed.", "SBI MF", now));

        // SILVER
        marketRepo.save(build("Mirae Asset Silver ETF", "SILVER", "SILVERETF", "98.45", "96.80", "19.8", "MEDIUM", "Tracks domestic silver prices. Industrial demand driver.", "Mirae Asset", now));
        marketRepo.save(build("ICICI Pru Silver ETF", "SILVER", "ISILVER", "102.30", "100.90", "18.5", "MEDIUM", "Physical silver ETF. Higher volatility than gold but better short-term returns.", "ICICI Prudential", now));

        // MUTUAL FUNDS (Flexi / Hybrid)
        marketRepo.save(build("Parag Parikh Flexi Cap Fund", "MUTUAL_FUND", "PPFCF", "76.42", "75.10", "21.3", "MEDIUM", "Global diversification + Indian equities. Internationally diversified flexi cap.", "PPFAS MF", now));
        marketRepo.save(build("HDFC Balanced Advantage Fund", "MUTUAL_FUND", "HDBAF", "398.50", "393.20", "15.6", "LOW", "Dynamic asset allocation between equity and debt. Lower volatility.", "HDFC MF", now));
        marketRepo.save(build("Axis Long Term Equity Fund (ELSS)", "MUTUAL_FUND", "AXELSS", "82.15", "80.90", "16.9", "MEDIUM", "Tax-saving ELSS fund with 3-year lock-in. 80C benefit up to ₹1.5L.", "Axis MF", now));

        log.info("Seeded {} market options.", marketRepo.count());
    }

    private MarketOption build(String name, String cat, String sym, String price, String prev,
                                String ret, String risk, String desc, String house, LocalDateTime now) {
        return MarketOption.builder()
            .name(name).category(cat).symbol(sym)
            .currentPrice(new BigDecimal(price))
            .prevPrice(new BigDecimal(prev))
            .oneYearReturn(new BigDecimal(ret))
            .riskLevel(risk).description(desc).fundHouse(house)
            .updatedAt(now).build();
    }

    // ─── Insurance Plans ──────────────────────────────────────────────────────

    private void seedInsurancePlans() {
        if (insuranceRepo.count() > 0) {
            log.info("Insurance plans already seeded — skipping.");
            return;
        }
        log.info("Seeding insurance plans...");

        // ── LIFE (Term) ──────────────────────────────────────────────────────
        insuranceRepo.save(InsurancePlan.builder()
            .type("LIFE").company("HDFC Life").name("Click 2 Protect Super")
            .annualPremium(new BigDecimal("9500")).coverageAmount(new BigDecimal("10000000"))
            .claimRatio(new BigDecimal("99.5"))
            .benefits("Return of premium option|Critical illness rider available|Online discount 15%|Cover up to age 85|Joint life option")
            .limitations("No surrender value in basic plan|Medical tests mandatory above 45L")
            .minAge(18).maxAge(65).minIncome(new BigDecimal("25000")).tier("BEST_VALUE").build());

        insuranceRepo.save(InsurancePlan.builder()
            .type("LIFE").company("Max Life").name("Smart Term Plan Plus")
            .annualPremium(new BigDecimal("8800")).coverageAmount(new BigDecimal("10000000"))
            .claimRatio(new BigDecimal("99.51"))
            .benefits("Highest claim ratio in industry|Waiver of premium on disability|Monthly income option|All-cause death covered")
            .limitations("No maturity benefit|Online-only purchase")
            .minAge(18).maxAge(60).minIncome(new BigDecimal("20000")).tier("PREMIUM").build());

        insuranceRepo.save(InsurancePlan.builder()
            .type("LIFE").company("ICICI Prudential").name("iProtect Smart")
            .annualPremium(new BigDecimal("10200")).coverageAmount(new BigDecimal("10000000"))
            .claimRatio(new BigDecimal("97.9"))
            .benefits("Terminal illness cover|Accidental death benefit|Tax benefit u/s 80C|Flexible premium payment")
            .limitations("Surrender value only after 5 years|Higher premium than peers")
            .minAge(20).maxAge(65).minIncome(new BigDecimal("30000")).tier("BASIC").build());

        // ── HEALTH ───────────────────────────────────────────────────────────
        insuranceRepo.save(InsurancePlan.builder()
            .type("HEALTH").company("Star Health").name("Comprehensive Plan")
            .annualPremium(new BigDecimal("18000")).coverageAmount(new BigDecimal("1000000"))
            .claimRatio(new BigDecimal("90.0"))
            .benefits("No co-payment|Home hospitalisation|Day care covered|Free health check-up yearly|Maternity cover")
            .limitations("2-year waiting period for pre-existing|Room rent capped at 5000/day")
            .minAge(18).maxAge(65).minIncome(new BigDecimal("20000")).tier("BEST_VALUE").build());

        insuranceRepo.save(InsurancePlan.builder()
            .type("HEALTH").company("HDFC Ergo").name("Optima Restore")
            .annualPremium(new BigDecimal("16500")).coverageAmount(new BigDecimal("1000000"))
            .claimRatio(new BigDecimal("91.0"))
            .benefits("Automatic restore of sum insured|No room rent capping|Mental illness covered|Loyalty bonus every year|Cashless at 10,000+ hospitals")
            .limitations("3-year waiting for pre-existing|Alcohol-related claims excluded")
            .minAge(18).maxAge(65).minIncome(new BigDecimal("25000")).tier("PREMIUM").build());

        insuranceRepo.save(InsurancePlan.builder()
            .type("HEALTH").company("Care Health").name("Care Supreme")
            .annualPremium(new BigDecimal("14200")).coverageAmount(new BigDecimal("500000"))
            .claimRatio(new BigDecimal("95.2"))
            .benefits("Highest claim ratio in health|No co-payment for age <60|Cover for 540+ day care|Unlimited restoration|OPD coverage")
            .limitations("Lower coverage amount|Less hospital network than Star")
            .minAge(18).maxAge(65).minIncome(new BigDecimal("15000")).tier("BASIC").build());

        // ── VEHICLE ──────────────────────────────────────────────────────────
        insuranceRepo.save(InsurancePlan.builder()
            .type("VEHICLE").company("HDFC Ergo").name("Comprehensive Car Insurance")
            .annualPremium(new BigDecimal("12000")).coverageAmount(new BigDecimal("800000"))
            .claimRatio(new BigDecimal("95.0"))
            .benefits("Zero depreciation|Engine protection|24x7 roadside assistance|NCB protection|RSA + key replacement")
            .limitations("Own damage excludes drunk driving|Delay in claim settlement reported")
            .minAge(18).maxAge(80).minIncome(new BigDecimal("10000")).tier("BEST_VALUE").build());

        insuranceRepo.save(InsurancePlan.builder()
            .type("VEHICLE").company("Acko").name("Acko Car Insurance")
            .annualPremium(new BigDecimal("8500")).coverageAmount(new BigDecimal("600000"))
            .claimRatio(new BigDecimal("97.0"))
            .benefits("Instant online issuance|Self-inspection app|Zero paperwork|Pickup & drop service|Highest digital claim ratio")
            .limitations("Limited garage network in tier-3 cities|Newer company with less legacy")
            .minAge(18).maxAge(80).minIncome(new BigDecimal("10000")).tier("PREMIUM").build());

        log.info("Seeded {} insurance plans.", insuranceRepo.count());
    }
}
