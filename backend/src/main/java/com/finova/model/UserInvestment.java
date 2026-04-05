package com.finova.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Builder
@NoArgsConstructor
@AllArgsConstructor

/**
 * UserInvestment — a user's actual position in a MarketOption.
 * Stores the buy price and units so we can compute real P&L.
 */
@Entity
@Table(name = "user_investments")
@Data
public class UserInvestment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Reference to the market option */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "market_option_id", nullable = false)
    private MarketOption marketOption;

    /** Amount in INR the user invested */
    @Column(name = "invested_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal investedAmount;

    /** NAV / price at time of purchase */
    @Column(name = "buy_price", nullable = false, precision = 12, scale = 4)
    private BigDecimal buyPrice;

    /** Units purchased = investedAmount / buyPrice */
    @Column(name = "units", nullable = false, precision = 12, scale = 4)
    private BigDecimal units;

    /** Optional monthly SIP amount */
    @Column(name = "monthly_sip", precision = 10, scale = 2)
    private BigDecimal monthlySip;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
