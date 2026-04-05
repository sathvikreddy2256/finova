package com.finova.repository;

import com.finova.model.User;
import com.finova.model.UserInvestment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface UserInvestmentRepository extends JpaRepository<UserInvestment, Long> {
    List<UserInvestment> findByUserOrderByCreatedAtDesc(User user);

    @Query("SELECT COALESCE(SUM(ui.investedAmount),0) FROM UserInvestment ui WHERE ui.user = :user")
    BigDecimal sumInvestedByUser(@Param("user") User user);
}
