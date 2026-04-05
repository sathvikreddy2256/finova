package com.finova.repository;

import com.finova.model.Investment;
import com.finova.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface InvestmentRepository extends JpaRepository<Investment, Long> {

    List<Investment> findByUserOrderByCreatedAtDesc(User user);

    @Query("SELECT COALESCE(SUM(i.currentValue), 0) FROM Investment i WHERE i.user = :user")
    BigDecimal sumCurrentValueByUser(@Param("user") User user);
}
