package com.finova.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;


@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
/**
 * MarketOption — represents investable assets (Large Cap, Gold, etc.)
 * Stored in investment_options table.
 * Prices are refreshed periodically by the market service.
 */
@Entity
@Table(name = "investment_options")
@Data
public class MarketOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Display name e.g. "Nifty 50 Index Fund" */
    @Column(nullable = false, length = 100)
    private String name;

    /** Category: LARGE_CAP, MID_CAP, SMALL_CAP, GOLD, SILVER, MUTUAL_FUND */
    @Column(nullable = false, length = 30)
    private String category;

    /** Ticker / symbol for reference */
    @Column(length = 30)
    private String symbol;

    /** Current NAV / price per unit in INR */
    @Column(name = "current_price", nullable = false, precision = 12, scale = 4)
    private BigDecimal currentPrice;

    /** Previous day closing price — used to calculate daily change % */
    @Column(name = "prev_price", precision = 12, scale = 4)
    private BigDecimal prevPrice;

    /** Simulated 1-year return % (used for display & suggestions) */
    @Column(name = "one_year_return", precision = 5, scale = 2)
    private BigDecimal oneYearReturn;

    /** Risk level: LOW, MEDIUM, HIGH */
    @Column(name = "risk_level", length = 10)
    private String riskLevel;

    /** Short description shown in the UI card */
    @Column(length = 300)
    private String description;

    /** Fund house / issuer name */
    @Column(name = "fund_house", length = 100)
    private String fundHouse;

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
