export function calculateFairPrice({
  materialCost = 0,
  laborHours = 0,
  hourlyWage = 150,
  packagingCost = 0
}) {
  const mat = Number(materialCost) || 0;
  const hours = Number(laborHours) || 0;
  const wage = Number(hourlyWage) || 150;
  const pkg = Number(packagingCost) || 0;

  const laborCost = hours * wage;
  const totalProductionCost = mat + laborCost + pkg;
  const artisanMargin = Math.round(totalProductionCost * 0.30);
  const suggestedSellingPrice = Math.round(totalProductionCost + artisanMargin);

  return {
    materialCost: mat,
    laborCost,
    packagingCost: pkg,
    totalProductionCost,
    artisanMargin,
    suggestedSellingPrice: Math.max(suggestedSellingPrice, 100),
    priceRange: {
      min: Math.max(Math.round(totalProductionCost * 1.15), 80),
      max: Math.max(Math.round(totalProductionCost * 1.55), 150)
    }
  };
}
