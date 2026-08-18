def tambah_angka(a, b):
    """Mengembalikan jumlah dua angka."""
    return a + b

hasil = tambah_angka(1, 2)
print(hasil)

def sapa(nama):
    return f"Halo {nama} ganteng!"

sapa = sapa("Hasbi")
print(sapa)

"""
Fungsi Bawaan yang Umum:

len(): Mengembalikan panjang objek.
print(): Mencetak teks ke konsol.
type(): Menentukan tipe objek.
sum(): Menghitung total dari urutan angka.
"""
def hitung_karakter(teks):
    return len(teks)

jumlah = hitung_karakter("aku hasbi as shiddiq ganteng")
print(f"Jumlah karakter 1: {jumlah}")

kalimat = input("Masukan teks: ")
jumlah1 = hitung_karakter(kalimat)
print(f"Jumlah kalimat 2: {jumlah1}")

def cek_password(password):
    if len(password) >= 8:
        return "Password Valid"
    else:
        return "Password tidak Valid"

pw = input("Masukan Password: ")
print(cek_password(pw))

def hitung_jumlah_data(data):
    return len(data)

angka = [10, 20, 30, 40, 50]
print(f"Jumlah data = {hitung_jumlah_data(angka)}")

print(type(1))
print(type(1.2))
print(type("hasbi"))
print(type(True))
print(type([1, 2, 3]))

angka1 = [1, 2, 3, 4, 5]
print(sum(angka1))
print(sum([1, 2, 2, 2, 2, 2]))
print(sum((1, 1, 1, 1, 0)))

help(len)

def kalikan(a, b):
    """Mengalikan 2 angka dan mengembalikan hasilnya"""
    return a * b

help(kalikan)

def bagi(a, b):
    """
    Membagi 2 angka dan mengembalikan hasilnya.
    Parameters:
        a (float) = pembilang.
        b (float) = penyebut.

    Returns:
        float = hasil pembagian.
    """
    return a / b

print(bagi.__doc__)

# argumen default
def sapa1(nama="hasbi"):
    return f"hai {nama}"

print(sapa1())
print(sapa1("hasbias"))

# argumen tanpa batas
def jumlah_semua1(*args):
    return sum(args)

print(jumlah_semua1(1, 2, 3))
print(jumlah_semua1(1, 2, 3, 40, 50))

# lambda adalah function anonim, yaitu function yang tidak memiliki nama dan biasanya ditulis dalam satu baris.
kuadrat = lambda x:x ** 2
print(kuadrat(10))

def is_even(number):
    """Check if a number is even?"""
    return number % 2 == 0

print(is_even(4))
print(is_even(5))