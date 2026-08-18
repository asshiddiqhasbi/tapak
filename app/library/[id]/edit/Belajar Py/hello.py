print("Hello, Python!")

print("")
# komentar satu baris dengan pagar
"""
komentar banyak baris dengan tanda kutip 3 biji

"""

print("")
print("ini perbandingan")
result_and = (5 > 3) and (10 < 20)
result_or = (5 > 3) or (10 < 20)
result_not = not (10 >= 20)

print(result_and)
print(result_or)
print(result_not)

print("")
print("ini pengkondisian")
nama = input("Masukan namamu: ")

if nama == "Hasbi":
    print("Kamu adalah bos terbaik")
elif nama == "Hasbi As Shiddiq":
    print("Bos terbaik sepanjang masa")
else:
    print("siapa nya?")

print("")
print("ini perulangan")
boss = ["hasbi", "as", "shiddiq"]
for bos in boss:
    print(bos)

print("")
print("ini while loop")
n = int(input("mau berhitung sampai berapa nich? "))
berhitung = 1

while berhitung <= n:
    print(berhitung)
    berhitung += 1

print("")
print("ini kontrol loop break, in range 5 harusnya")
for i in range(5):
    if i == 3:
        break
    print(i)

print("")
print("ini kontrol loop continue, in range 10 harusnya")
for q in range(10):
    if q % 2 == 0:
        continue
    print(q)

print("")
print("ini kontrol loop pass, karena pass ya kosong")
for w in range(10):
    pass

print("")
print("ini def atau fungsi")


def greet(name):
    return f"Halo, aku {name} lagi belajar Py.."


pesan = greet("Hasbi")
print(pesan)

print("")


def penjumlahan(a, b=5):
    return a + b


hitung = penjumlahan(10)
print(hitung)

print("")
print(
    "fungsi lambda adl fungsi anonim, didefinisikan dengan keyword lambda"
    " berguna untuk fungsi singkat"
)
square = lambda x: x**2
print(square(4))

print("")
print("List: Koleksi terurut dan dapat diubah")
my_list = [1, 2, 3, "hasbi"]
print(my_list)

print("")
print("Tuple: sama dengan list, tapi tidak bisa diubah setelah dibuat")
my_tuple = (4, 5, 6)
print(my_tuple)

print("")
print("Set: koleksi tidak terurut dari item unik")
my_set = {7, 8, 9, 8}
print(my_set)

print("")
print("Dictionary: Pasangan kunci-nilai untuk akses data efisien")
person = {"nama": "Hasbi", "umur": 21, "kota": "Bandung"}
print(person["umur"])

print("")
print("List comprehensions untuk Kode Ringkas")
square = [x**2 for x in range(10)]
print(square)

print("")
print("Penanganan kesalahan dan debugging")
try:
    hasil = 10 / 0
except ZeroDivisionError:
    print("gabisa bagi dengan nol bro")

print("")
print("contoh try, except, finally")
try:
    angka = int(input("Masukan angka: "))
    print(10 / angka)
except ValueError:
    print("Isi dengan angka dong")
except ZeroDivisionError:
    print("gabisa bagi nol bro")
finally:
    print("program beres")
