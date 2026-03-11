from selenium.webdriver.common.by import By


class LoginPage:

    username_input = (By.XPATH, '//*[@id="root"]/div[2]/div[2]/div/div/form/div[1]/div/input')
    password_input = (By.XPATH, '//*[@id="root"]/div[2]/div[2]/div/div/form/div[2]/div/input')
    login_button = (By.XPATH, "//button[@type='submit']")

    def __init__(self, driver):
        self.driver = driver

    def open(self):
        self.driver.get("http://localhost:5173/login")

    def login(self, username, password):
        self.driver.find_element(*self.username_input).send_keys(username)
        self.driver.find_element(*self.password_input).send_keys(password)
        self.driver.find_element(*self.login_button).click()