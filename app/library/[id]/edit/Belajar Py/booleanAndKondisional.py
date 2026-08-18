x = 5
y = 10

print(x == y)
print(x < y)

# operator logika
a = True
b = False

print (a and b)
print (a or b)
print (not b)

temperature = 30

if temperature >= 30:
    print("panas bener")
else:
    print("masih aman")

score = int(input("Masukan Score: "))

if score == 100:
    nilai = "S"
elif score >= 85:
    nilai = "A"
elif score >= 75:
    nilai = "B"
elif score >= 65:
    nilai = "C"
else:
    nilai = "ulangiii"

print(nilai)

# Kondisional Bersarang (Nested Conditionals)
umur = int(input("Masukan Umur: "))

if umur >= 18:
    punya_sim = input("Sudah punya sim? (y/n): ").lower() == "y"
    if punya_sim:
        print("oke aman, gaskeun kamu boleh bawa kendaraan")
    else:
        print("bikin sim dulu nya")
else:
    print("belum cukup umur, sabar nya")