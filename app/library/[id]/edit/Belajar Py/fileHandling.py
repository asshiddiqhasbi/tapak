with open("contoh.txt", "w") as file:
    file.write("aku hasbi aku hasbi aku hasbi")

with open("contoh.txt", "r") as file:
    content = file.read()
    print(content)