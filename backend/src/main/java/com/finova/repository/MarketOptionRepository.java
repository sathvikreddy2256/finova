package com.finova.repository;

import com.finova.model.MarketOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MarketOptionRepository extends JpaRepository<MarketOption, Long> {
    List<MarketOption> findAllByOrderByCategoryAscNameAsc();
    List<MarketOption> findByRiskLevel(String riskLevel);
    List<MarketOption> findByCategory(String category);
}
