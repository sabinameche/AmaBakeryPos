import pytest
from pages.login_page import LoginPage
from users import users


@pytest.mark.parametrize("user", users)
def test_multiple_user_login(driver, user):

    login_page = LoginPage(driver)

    login_page.open()

    login_page.login(user["username"], user["password"])

    assert "dashboard" in driver.current_url