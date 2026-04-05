package com.finova.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO for Transaction requests and responses.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDto {
    private Long id;
    private String type;        // INCOME or EXPENSE
    private BigDecimal amount;
    private String category;
    private String description;
    private LocalDate date;

    /** Summary DTO for dashboard aggregates */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SummaryDto {
        private BigDecimal totalIncome;
        private BigDecimal totalExpense;
        private BigDecimal savings;
        private BigDecimal investments;
    }
}
