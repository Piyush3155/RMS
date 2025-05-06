import Image from "next/image"
import Link from "next/link"
import { Clock, MapPin, Phone, Star, Utensils, Salad } from "lucide-react"

export default function RestaurantLanding() {
  return (
    <div className="flex min-h-screen flex-col bg-yellow-100">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur text-orange-600 supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="h-6 w-6" />
            <span className="text-xl font-bold">Bite & CO</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link
              href="#menu"
              className="text-sm font-medium transition-colors hover:text-orange-800 hover:underline underline-offset-4"
            >
              Menu
            </Link>
            <Link
              href="#about"
              className="text-sm font-medium transition-colors hover:text-orange-800 hover:underline underline-offset-4"
            >
              About
            </Link>
            <Link
              href="#gallery"
              className="text-sm font-medium transition-colors hover:text-orange-800 hover:underline underline-offset-4"
            >
              Gallery
            </Link>
            <Link
              href="#contact"
              className="text-sm font-medium transition-colors hover:text-orange-800 hover:underline underline-offset-4"
            >
              Contact
            </Link>
          </nav>
          <button className="p-2 bg-amber-950 text-yellow-100 px-4 rounded-md hover:bg-amber-900 transition-colors">
            Reserve A Table
          </button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative">
          <div className="absolute inset-0 z-0">
            <Image
              src="/dash.jpg?height=800&width=1600"
              alt="Restaurant interior"
              fill
              className="object-cover brightness-[0.6]"
              priority
            />
          </div>
          <div className="container relative z-10 flex flex-col items-center justify-center py-24 text-center text-white md:py-32 lg:py-40">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">A Culinary Journey Awaits</h1>
            <p className="mt-6 max-w-md text-lg text-gray-200 md:text-xl">
              Experience the finest dining with our chef-crafted menu featuring locally sourced ingredients and seasonal
              specialties.
            </p>
            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <Link
                href="#menu"
                className="flex items-center justify-center gap-2 bg-yellow-400 text-amber-950 p-2 px-6 rounded-md hover:bg-yellow-300 transition-colors"
              >
                View Our Menu <Salad className="h-5 w-5" />
              </Link>
              <Link
                href="#contact"
                className="flex items-center justify-center bg-amber-950 text-yellow-400 p-2 px-6 rounded-md hover:bg-amber-900 transition-colors"
              >
                Make a Reservation
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 md:py-24">
          <div className="container">
            <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl text-orange-950">
              Why Choose Bite & CO
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center text-center text-orange-900">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                  <Utensils className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="mt-4 text-xl font-medium">Exquisite Cuisine</h3>
                <p className="mt-2 text-orange-800">
                  Our award-winning chefs create memorable dishes using the freshest ingredients.
                </p>
              </div>
              <div className="flex flex-col items-center text-center text-orange-900">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                  <MapPin className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="mt-4 text-xl font-medium">Prime Location</h3>
                <p className="mt-2 text-orange-800">
                  Located in the heart of downtown with stunning views and convenient access.
                </p>
              </div>
              <div className="flex flex-col items-center text-center text-orange-900">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                  <Star className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="mt-4 text-xl font-medium">Exceptional Service</h3>
                <p className="mt-2 text-orange-800">
                  Our attentive staff ensures a memorable dining experience for every guest.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Menu Highlights */}
        <section id="menu" className="bg-amber-50 py-16 md:py-24">
          <div className="container">
            <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl text-orange-950">
              Menu Highlights
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  name: "Pan-Seared Scallops",
                  description: "Fresh scallops with citrus glaze, served with seasonal vegetables",
                  price: "$28",
                  image: "/chicken.jpg?height=300&width=400",
                },
                {
                  name: "Truffle Risotto",
                  description: "Creamy arborio rice with wild mushrooms and truffle oil",
                  price: "$24",
                  image: "/noodles.jpg?height=300&width=400",
                },
                {
                  name: "Grilled Filet Mignon",
                  description: "Prime beef with red wine reduction and roasted potatoes",
                  price: "$36",
                  image: "/fishcurry.jpg?height=300&width=400",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-lg bg-white shadow-md transition-transform hover:scale-105"
                >
                  <div className="relative h-48">
                    <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-medium text-orange-950">{item.name}</h3>
                      <span className="text-lg font-bold text-orange-600">{item.price}</span>
                    </div>
                    <p className="mt-2 text-orange-800">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link
                href="#"
                className="inline-flex items-center justify-center bg-amber-950 text-yellow-100 p-3 px-6 rounded-md hover:bg-amber-900 transition-colors"
              >
                View Full Menu
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 md:py-24">
          <div className="container">
            <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl text-orange-950">
              What Our Guests Say
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  name: "Sarah Johnson",
                  quote:
                    "The best dining experience I've had in years. The atmosphere was perfect and the food was exceptional.",
                  rating: 5,
                },
                {
                  name: "Michael Chen",
                  quote:
                    "Incredible flavors and presentation. The chef's tasting menu is a must-try for any food enthusiast.",
                  rating: 5,
                },
                {
                  name: "Emily Rodriguez",
                  quote: "From the moment we walked in, the service was impeccable. Will definitely be returning soon!",
                  rating: 5,
                },
              ].map((testimonial, index) => (
                <div
                  key={index}
                  className="rounded-lg border bg-orange-950 text-orange-50 p-6 shadow-sm transition-transform hover:scale-105"
                >
                  <div className="flex">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <blockquote className="mt-4">
                    <p className="text-yellow-100">&quot;{testimonial.quote}&quot;</p>
                  </blockquote>
                  <p className="mt-4 font-medium text-yellow-200">{testimonial.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reservation */}
        <section id="contact" className="bg-amber-700 text-yellow-50 py-16 md:py-24">
          <div className="container">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Make a Reservation</h2>
                <p className="mt-4 text-yellow-100">
                  Reserve your table online or call us directly. We look forward to serving you.
                </p>
                <div className="mt-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5" />
                    <span>(555) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5" />
                    <span>123 Main Street, Cityville, State 12345</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5" />
                    <div>
                      <p>Monday - Thursday: 5:00 PM - 10:00 PM</p>
                      <p>Friday - Sunday: 4:00 PM - 11:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-yellow-100 p-6 shadow-lg text-amber-950">
                <h3 className="text-xl font-medium">Reserve Your Table</h3>
                <form className="mt-4 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Name
                      </label>
                      <input
                        id="name"
                        className="w-full rounded-md border border-amber-300 bg-yellow-100 px-3 py-2 text-sm ring-offset-background placeholder:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        className="w-full rounded-md border border-amber-300 bg-yellow-100 px-3 py-2 text-sm ring-offset-background placeholder:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        placeholder="Your email"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="date" className="text-sm font-medium">
                        Date
                      </label>
                      <div className="flex">
                        <input
                          id="date"
                          type="date"
                          className="w-full rounded-md border border-amber-300 bg-yellow-100 px-3 py-2 text-sm ring-offset-background placeholder:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="time" className="text-sm font-medium">
                        Time
                      </label>
                      <select
                        id="time"
                        className="w-full rounded-md border border-amber-300 bg-yellow-100 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      >
                        <option>5:00 PM</option>
                        <option>6:00 PM</option>
                        <option>7:00 PM</option>
                        <option>8:00 PM</option>
                        <option>9:00 PM</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="guests" className="text-sm font-medium">
                      Number of Guests
                    </label>
                    <select
                      id="guests"
                      className="w-full rounded-md border border-amber-300 bg-yellow-100 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      <option>1 person</option>
                      <option>2 people</option>
                      <option>3 people</option>
                      <option>4 people</option>
                      <option>5 people</option>
                      <option>6+ people</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="special-requests" className="text-sm font-medium">
                      Special Requests
                    </label>
                    <textarea
                      id="special-requests"
                      className="w-full rounded-md border border-amber-300 bg-yellow-100 px-3 py-2 text-sm ring-offset-background placeholder:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      rows={3}
                      placeholder="Any special requests or dietary requirements"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="bg-amber-950 rounded-md text-yellow-100 p-2 px-4 hover:bg-amber-900 transition-colors"
                  >
                    Reserve Now
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section id="gallery" className="py-16 md:py-24">
          <div className="container text-amber-950">
            <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Our Gallery</h2>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[
                { id: 1, text: "Restaurant Interior" },
                { id: 2, text: "Chef's Special" },
                { id: 3, text: "Fine Dining" },
                { id: 4, text: "Private Events" },
                { id: 5, text: "Outdoor Seating" },
                { id: 6, text: "Wine Selection" },
                { id: 7, text: "Dessert Platter" },
                { id: 8, text: "Seasonal Menu" },
              ].map((item) => (
                <div key={item.id} className="group relative aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={`/dash.jpg?height=400&width=400&text=${item.text}`}
                    alt={item.text}
                    fill
                    className="object-cover transition-transform group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="bg-amber-50 py-16 md:py-24 text-amber-950">
          <div className="container">
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="relative aspect-square overflow-hidden rounded-lg sm:aspect-[4/3]">
                <Image
                  src="/dash.jpg?height=600&width=800&text=Our+Story"
                  alt="Chef preparing food"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col justify-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Our Story</h2>
                <div className="mt-6 space-y-4 text-orange-800">
                  <p>
                    Founded in 2010, Bite & CO began with a simple mission: to create an unforgettable dining experience
                    that celebrates the art of fine cuisine.
                  </p>
                  <p>
                    Our executive chef, with over 20 years of experience in Michelin-starred restaurants across Europe,
                    brings a unique perspective to every dish, blending classic techniques with innovative approaches.
                  </p>
                  <p>
                    We believe in sustainable dining and work closely with local farmers and producers to source the
                    freshest seasonal ingredients, ensuring that every plate not only delights the palate but also
                    respects our environment.
                  </p>
                </div>
                <div className="mt-8">
                  <Link
                    href="#"
                    className="inline-flex items-center justify-center bg-amber-950 text-yellow-100 p-2 px-6 rounded-md hover:bg-amber-900 transition-colors"
                  >
                    Learn More About Us
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="border-t py-12 text-amber-950">
          <div className="container">
            <div className="flex flex-col items-center text-center">
              <h3 className="text-2xl font-bold">Stay Updated</h3>
              <p className="mt-2 text-orange-800">Subscribe to our newsletter for special offers and events</p>
              <div className="mt-4 flex w-full max-w-md gap-2">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="w-full rounded-md border border-amber-300 bg-yellow-100 px-3 py-2 text-sm ring-offset-background placeholder:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                />
                <button className="bg-amber-950 rounded-md text-yellow-100 p-2 px-4 hover:bg-amber-900 transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-orange-800 py-8 text-yellow-100">
        <div className="container">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                <span className="text-lg font-bold">Bite & CO</span>
              </div>
              <p className="mt-2 text-sm text-yellow-200">Exceptional dining experiences in the heart of the city.</p>
            </div>
            <div>
              <h4 className="text-sm font-medium">Contact</h4>
              <ul className="mt-2 space-y-2 text-sm text-yellow-200">
                <li>123 Main Street, Cityville</li>
                <li>State 12345</li>
                <li>(555) 123-4567</li>
                <li>info@biteandco.com</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium">Hours</h4>
              <ul className="mt-2 space-y-2 text-sm text-yellow-200">
                <li>Monday - Thursday: 5:00 PM - 10:00 PM</li>
                <li>Friday - Sunday: 4:00 PM - 11:00 PM</li>
                <li>Closed on major holidays</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium">Follow Us</h4>
              <div className="mt-2 flex gap-4">
                <Link href="#" className="text-yellow-200 hover:text-white transition-colors">
                  <span className="sr-only">Facebook</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </Link>
                <Link href="#" className="text-yellow-200 hover:text-white transition-colors">
                  <span className="sr-only">Instagram</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                </Link>
                <Link href="#" className="text-yellow-200 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t border-orange-700 pt-6 text-center">
            <p className="text-xs text-yellow-200">
              © {new Date().getFullYear()} Bite & CO Restaurant. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
