package com.finova.repository;

import com.finova.model.InsurancePlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;

@Repository
public interface InsurancePlanRepository extends JpaRepository<InsurancePlan, Long> {
    List<InsurancePlan> findByType(String type);

    // Suitable plans: age within range, income meets minimum
    @Query("SELECT p FROM InsurancePlan p WHERE p.type = :type " +
           "AND p.minAge <= :age AND p.maxAge >= :age " +
           "AND p.minIncome <= :income " +
           "ORDER BY p.claimRatio DESC")
    List<InsurancePlan> findSuitablePlans(
        @Param("type") String type,
        @Param("age") int age,
        @Param("income") BigDecimal income
    );
}
