# Pemrograman Berorientasi Objek (OOP) di Python (Object-Oriented Programming (OOP) in Python)
print("Kelas dan Objek: Membuat Blueprint untuk Instance")
print("Kelas adalah cetak biru untuk membuat objek. Objek adalah instance dari kelas.")
class dog:
    def __init__(self, name):
        self.name = name
    def bark(self):
        print(f"{self.name} whoof..whoof")

my_dog = dog("Botak")
my_dog.bark()

print("")
print("Pewarisan: Menggunakan Kembali Kode Melalui Hubungan Induk-Anak (inheritance)")
print("Pewarisan memungkinkan satu kelas mewarisi atribut dan metode dari kelas lain.")
class animal:
    def speak(self):
        print("hewan berbicara")

class dog2(animal):
    def bark(self):
        print("whooff.. whooff")

Dog = dog2()
Dog.speak()
Dog.bark()

print("")
print("Polimorfisme: Mengimplementasikan Metode dalam Berbagai Cara (polymorphism)")
print("Polimorfisme memungkinkan metode atau fungsi berperilaku berbeda tergantung pada objek atau tipe data yang digunakan. Ini adalah salah satu konsep utama dalam Pemrograman Berorientasi Objek (OOP) dan memberikan fleksibilitas dalam kode.")
print("")
print("polimorfisme dengan fungsi bawaan")
print(len("Hasbi As Shiddiq"))
print(len([1, 2, 3, 4, 5]))