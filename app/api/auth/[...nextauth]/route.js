import { dbfs } from "@/app/firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import crypto from "crypto"
import {  getAuth, signInWithEmailAndPassword } from "firebase/auth";
const auth = getAuth()
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password,defaultEmail } = credentials;
        const userRef = doc(dbfs,"admins",email)
        const userSnapshot = await getDoc(userRef)
        if(userSnapshot.exists()){
          const namesurname = userSnapshot.data()&&userSnapshot.data().namesurname
          const dbPassword = userSnapshot.data().password
          const mystr= crypto.createHash("sha256").update(password).digest("hex");
          if(mystr!==dbPassword){
            throw new Error("Şifre hatalı lütfen tekrar deneyiniz.")
          }
          const userCredential = await signInWithEmailAndPassword(auth, defaultEmail, mystr);
          return {
            id: "1",
            name: namesurname,
            email: defaultEmail,
          };
        }else{
          throw new Error("Uygulamada kaydınız bulunmamaktadır.")
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/", 
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async redirect({ baseUrl }){
        return baseUrl + "/aracgiris";
    },
  },
};  

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
