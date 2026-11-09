from app.api_inventory import safe_csv
def test_csv_formula_escape():
    assert safe_csv("=SUM(A1:A2)").startswith("'")
    assert safe_csv("Normal")=="Normal"
