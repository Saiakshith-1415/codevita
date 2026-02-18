import string

def check_password_strength(password):
    length = len(password) >= 8
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_symbol = any(c in string.punctuation for c in password)

    score = sum([length, has_upper, has_lower, has_digit, has_symbol])

    if score == 5:
        return "Strong password 💪"
    elif score >= 3:
        return "Medium password ⚠️"
    else:
        return "Weak password ❌"


if __name__ == "__main__":
    pwd = input("Enter password: ")
    result = check_password_strength(pwd)
    print(result)