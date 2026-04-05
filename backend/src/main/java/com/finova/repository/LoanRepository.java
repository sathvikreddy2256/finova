package com.finova.repository;

import com.finova.model.Loan;
import com.finova.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {

    List<Loan> findByUserOrderByCreatedAtDesc(User user);

    @Query("SELECT COALESCE(SUM(l.outstandingAmount), 0) FROM Loan l WHERE l.user = :user")
    BigDecimal sumOutstandingByUser(@Param("user") User user);
}
