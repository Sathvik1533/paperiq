"""
Unit and regression tests verifying 0/1 Knapsack Least-Cost Branch and Bound
algorithmic correctness, absence of hardcoded results, and mathematical integrity.
"""
import pytest
from app.algorithms.knapsack_solver import solve_knapsack_lcbb, compute_bounds, Item


def test_knapsack_standard_university_daa_instance():
    """
    Standard textbook instance:
    Profits = [10, 10, 12, 18]
    Weights = [2, 4, 6, 9]
    Capacity W = 15
    """
    profits = [10, 10, 12, 18]
    weights = [2, 4, 6, 9]
    capacity = 15

    result = solve_knapsack_lcbb(profits, weights, capacity)

    # 1. Verify optimal profit is 38 (calculated dynamically)
    assert result.optimal_profit == 38.0

    # 2. Verify optimal weight does not exceed capacity
    assert result.optimal_weight == 15.0
    assert result.optimal_weight <= capacity

    # 3. Verify selected items
    # Original items 0 (p=10, w=2), 1 (p=10, w=4), 3 (p=18, w=9)
    # Sum of profits: 10 + 10 + 18 = 38
    # Sum of weights: 2 + 4 + 9 = 15
    assert result.selected_items_original_order == [1, 1, 0, 1]

    # 4. Verify mathematical properties
    actual_profit = sum(p * x for p, x in zip(profits, result.selected_items_original_order))
    assert actual_profit == result.optimal_profit

    actual_weight = sum(w * x for w, x in zip(weights, result.selected_items_original_order))
    assert actual_weight == result.optimal_weight

    # 5. Verify state-space tree was generated dynamically
    assert result.total_nodes_generated > 1
    assert result.nodes_expanded > 1
    assert len(result.tree_trace) > 1
    assert "| Node | Level |" in result.latex_table


def test_knapsack_all_combinations_feasibility():
    """
    Exhaustively check all 2^4 = 16 combinations to prove 38 is the absolute global optimum.
    """
    profits = [10, 10, 12, 18]
    weights = [2, 4, 6, 9]
    capacity = 15
    n = len(profits)

    max_brute_profit = 0
    best_brute_comb = None

    for mask in range(1 << n):
        comb = [(mask >> k) & 1 for k in range(n)]
        tot_w = sum(comb[k] * weights[k] for k in range(n))
        tot_p = sum(comb[k] * profits[k] for k in range(n))
        if tot_w <= capacity:
            if tot_p > max_brute_profit:
                max_brute_profit = tot_p
                best_brute_comb = comb

    result = solve_knapsack_lcbb(profits, weights, capacity)
    assert result.optimal_profit == max_brute_profit
    assert result.selected_items_original_order == best_brute_comb


def test_knapsack_second_instance():
    """
    Test with a second distinct problem instance:
    Profits = [24, 18, 18, 10]
    Weights = [24, 10, 10, 7]
    Capacity = 25
    Ratios:
    Item 0: 24/24 = 1.0
    Item 1: 18/10 = 1.8
    Item 2: 18/10 = 1.8
    Item 3: 10/7  = 1.428
    Best packing: Items 1 and 2 (w=20, p=36)
    """
    profits = [24, 18, 18, 10]
    weights = [24, 10, 10, 7]
    capacity = 25

    result = solve_knapsack_lcbb(profits, weights, capacity)
    assert result.optimal_profit == 36.0
    assert result.optimal_weight == 20.0
    assert result.selected_items_original_order == [0, 1, 1, 0]


def test_knapsack_invalid_inputs():
    with pytest.raises(ValueError, match="identical length"):
        solve_knapsack_lcbb([10, 20], [5], 10)

    with pytest.raises(ValueError, match="At least one item"):
        solve_knapsack_lcbb([], [], 10)

    with pytest.raises(ValueError, match="Capacity must be positive"):
        solve_knapsack_lcbb([10], [5], 0)
