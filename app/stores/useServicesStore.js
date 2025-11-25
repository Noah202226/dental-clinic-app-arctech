"use client";

import { create } from "zustand";
import { ID } from "appwrite";
import toast from "react-hot-toast";
import { databases } from "../lib/appwrite";

// 🧩 Replace with your database & collection IDs
const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;
const COLLECTION_ID = "services";

export const useServicesStore = create((set, get) => ({
  services: [],
  loading: false,

  // ✅ Fetch all services
  fetchServices: async () => {
    set({ loading: true });
    try {
      const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID);
      set({ services: res.documents });
    } catch (err) {
      console.error("Fetch services failed:", err);
      toast.error("Failed to load services");
    } finally {
      set({ loading: false });
    }
  },

  // ✅ Add a new service (with numeric validation)
  addService: async (service) => {
    try {
      // normalize and validate price
      const priceRaw = service.servicePrice ?? service.price ?? "";
      const normalized = String(priceRaw).replace(/\s+/g, "").replace(",", ".");
      const price = parseFloat(normalized);

      if (!service.serviceName || !isFinite(price)) {
        throw new Error("Please provide a valid service name and price");
      }

      const payload = {
        serviceName: service.serviceName,
        serviceDescription: service.serviceDescription || "",
        servicePrice: price,
      };

      const res = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        payload
      );

      set({ services: [res, ...get().services] });
      toast.success("Service added successfully!");
    } catch (err) {
      console.error("Error adding service:", err);
      toast.error(err.message || "Failed to add service");
    }
  },

  // ✅ Delete a service
  deleteService: async (id) => {
    try {
      if (!window.confirm("Are you sure you want to delete this service?"))
        return;

      await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, id);
      set({
        services: get().services.filter((s) => s.$id !== id),
      });
      toast.success("Service deleted");
    } catch (err) {
      console.error("Delete service failed:", err);
      toast.error("Failed to delete service");
    }
  },
}));
