package com.finova.repository;

import com.finova.model.Transaction;
import com.finova.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Repository for Transaction entity with custom query methods.
 */
@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    // Get all transactions for a user, newest first
    List<Transaction> findByUserOrderByDateDesc(User user);

    // Get recent transactions (top 10) for dashboard
    List<Transaction> findTop10ByUserOrderByDateDesc(User user);

    // Get transactions by type (INCOME or EXPENSE)
    List<Transaction> findByUserAndTypeOrderByDateDesc(User user, String type);

    // Get transactions between two dates
    List<Transaction> findByUserAndDateBetweenOrderByDateDesc(User user, LocalDate from, LocalDate to);

    // Sum of all amounts by type for a user — used for total stats
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user = :user AND t.type = :type")
    BigDecimal sumAmountByUserAndType(@Param("user") User user, @Param("type") String type);

    // Sum by type for current month only
    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.user = :user AND t.type = :type AND MONTH(t.date) = MONTH(CURRENT_DATE) AND YEAR(t.date) = YEAR(CURRENT_DATE)")
    BigDecimal sumCurrentMonthByUserAndType(@Param("user") User user, @Param("type") String type);

    // Get last 6 months grouped by month for chart — returns [month, year, totalAmount, type]
    @Query(value = """
        SELECT MONTH(date) as month, YEAR(date) as year, type, COALESCE(SUM(amount),0) as total
        FROM transactions
        WHERE user_id = :userId
          AND date >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
        GROUP BY YEAR(date), MONTH(date), type
        ORDER BY YEAR(date) ASC, MONTH(date) ASC
        """, nativeQuery = true)
    List<Object[]> getMonthlyTotalsForChart(@Param("userId") Long userId);

    // Average expense per category over last 3 months (used by AI service logic)
    @Query(value = """
        SELECT category, COALESCE(AVG(monthly_total), 0) as avg_expense
        FROM (
            SELECT category, MONTH(date) as m, SUM(amount) as monthly_total
            FROM transactions
            WHERE user_id = :userId AND type = 'EXPENSE'
              AND date >= DATE_SUB(CURRENT_DATE, INTERVAL 3 MONTH)
            GROUP BY category, MONTH(date)
        ) sub
        GROUP BY category
        """, nativeQuery = true)
    List<Object[]> getAvgExpensePerCategory(@Param("userId") Long userId);
}
