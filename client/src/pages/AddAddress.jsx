import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '@clerk/clerk-react';
import { assets } from '../assets/assets';
import AddressForm from '../components/AddressForm';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';

const AddAddress = () => {
    const { navigate } = useAppContext();
    const { userId, getToken } = useAuth();
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(() => {
        // Check if we're coming from a navigation (localStorage has the loading flag)
        const isNavigating = localStorage.getItem('productDetailsLoading') === 'true';
        return isNavigating || true; // Default to true for initial load
    });
    const [editingAddress, setEditingAddress] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [addressToDeleteId, setAddressToDeleteId] = useState(null);

    // Fetch addresses when component mounts
    useEffect(() => {
        // Clear the loading flag from localStorage
        localStorage.removeItem('productDetailsLoading');

        // Since we're using ProtectedRoute, we know the user is signed in
        fetchAddresses();
    }, [userId]);

    const fetchAddresses = async () => {
        if (!userId) return;

        try {
            setLoading(true);
            const token = await getToken();
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

            const response = await fetch(`${apiUrl}/address/list`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ clerkId: userId })
            });

            const data = await response.json();

            if (data.success) {
                setAddresses(data.addresses);
            } else {
                toast.error(data.message || 'Failed to load addresses');
            }
        } catch (error) {
            console.error('Error fetching addresses:', error);
            toast.error('Error loading addresses');
        } finally {
            setLoading(false);
        }
    };

    const handleSetDefault = async (addressId) => {
        try {
            const token = await getToken();
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

            const response = await fetch(`${apiUrl}/address/set-default`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    addressId,
                    clerkId: userId
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Default address updated');
                fetchAddresses(); // Refresh the list
            } else {
                toast.error(data.message || 'Failed to update default address');
            }
        } catch (error) {
            console.error('Error setting default address:', error);
            toast.error('Error updating default address');
        }
    };

    const handleDelete = async (addressId) => {
        // Find the address to check if it's default
        const addressToDelete = addresses.find(addr => addr._id === addressId);

        if (addressToDelete?.isDefault) {
            toast.error('Cannot delete default address. Please set another address as default first.');
            return;
        }

        // Show custom confirmation dialog
        setAddressToDeleteId(addressId);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteAddress = async () => {
        setShowDeleteConfirm(false); // Close the dialog
        if (!addressToDeleteId) return;

        try {
            const token = await getToken();
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

            const response = await fetch(`${apiUrl}/address/delete`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    addressId: addressToDeleteId,
                    clerkId: userId
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Address deleted');
                fetchAddresses(); // Refresh the list
            } else {
                toast.error(data.message || 'Failed to delete address');
            }
        } catch (error) {
            console.error('Error deleting address:', error);
            toast.error('Error deleting address');
        } finally {
            setAddressToDeleteId(null); // Clear the ID
        }
    };

    const cancelDeleteAddress = () => {
        setShowDeleteConfirm(false);
        setAddressToDeleteId(null);
    };

    const handleAddressSaved = () => {
        fetchAddresses();
        setShowForm(false);
        setEditingAddress(null);
    };

    const handleEditAddress = (address) => {
        setEditingAddress(address);
        setShowForm(true);
    };



    // Effect to prevent body scrolling when dialog is open
    useEffect(() => {
        if (showDeleteConfirm) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }

        // Cleanup function to reset overflow when component unmounts
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showDeleteConfirm]);

    return (
        <div className='container mx-auto px-4 py-8 max-w-5xl mt-10'>
            {/* Add a style tag for the no-scroll class */}
            <style>
                {`
                .no-scroll {
                    overflow: hidden;
                }
                `}
            </style>
            <div className="flex items-center mb-6">
                <button
                    onClick={() => {
                        if (showForm) {
                            setShowForm(false);
                            setEditingAddress(null);
                        } else {
                            localStorage.setItem('productDetailsLoading', 'true');
                            navigate(-1);
                        }
                    }}
                    className="group cursor-pointer flex items-center gap-2 text-primary font-medium mr-2"
                >
                    <img src={assets.arrow_right_icon_colored} alt='arrow' className='group-hover:translate-x-1 transition' />
                </button>
                <p className='text-2xl md:text-3xl text-gray-500'>
                    {showForm ? (editingAddress ? 'Edit Address' : 'Add New Address') : 'Manage '}
                    {!showForm && <span className='font-semibold text-primary'>Addresses</span>}
                </p>
            </div>

            <div className='flex flex-col-reverse md:flex-row justify-between mt-6 gap-8'>
                <div className='flex-1'>
                    {showForm ? (
                        <div className="bg-white p-6 rounded-lg shadow mb-8">
                            {/* Form header removed as it's now handled in the main page header */}
                            <AddressForm
                                existingAddress={editingAddress}
                                onSave={handleAddressSaved}
                                onCancel={() => {
                                    setShowForm(false);
                                    setEditingAddress(null);
                                }}
                            />
                        </div>
                    ) : (
                        <div className="bg-white p-6 rounded-lg shadow">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
                                <h2 className="text-xl font-semibold text-gray-700">Your Addresses</h2>
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="px-5 py-2.5 bg-primary text-white rounded-md hover:bg-primary-dark flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center cursor-pointer"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add New Address
                                </button>
                            </div>

                            {loading ? (
                                <Loader text="Loading addresses..." />
                            ) : addresses.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <p>You don't have any saved addresses yet.</p>
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="mt-4 px-5 py-2.5 bg-primary text-white rounded-md hover:bg-primary-dark flex items-center gap-2 mx-auto text-sm sm:text-base cursor-pointer"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add Your First Address
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {addresses.map((address) => (
                                        <div
                                            key={address._id}
                                            className="border rounded-lg p-4 border-gray-200"
                                        >
                                            {/* Responsive layout: stack on small screens, row on medium and up */}
                                            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 md:gap-2">
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-medium">
                                                            {address.firstName} {address.lastName}
                                                        </h3>
                                                        {address.isDefault && (
                                                            <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                                                                Default
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-600 mb-1.5">{address.phoneNumber}</p>
                                                    <p className="text-gray-600 mb-1.5">{address.addressLine1}</p>
                                                    {address.addressLine2 && (
                                                        <p className="text-gray-600 mb-1.5">{address.addressLine2}</p>
                                                    )}
                                                    <p className="text-gray-600 mb-1.5">
                                                        {address.city}, {address.state} {address.postalCode}
                                                    </p>
                                                    <p className="text-gray-600">{address.country}</p>
                                                </div>
                                                {/* Action buttons: stack vertically, align differently on screen sizes */}
                                                <div className="flex flex-col items-start md:items-end gap-2 mt-3 md:mt-0 flex-shrink-0">
                                                    <button
                                                        onClick={() => handleEditAddress(address)}
                                                        className="text-sm text-gray-600 hover:underline py-1 px-2 rounded hover:bg-gray-100 w-full md:w-auto text-left md:text-right cursor-pointer"
                                                    >
                                                        Edit
                                                    </button>
                                                    {!address.isDefault && (
                                                        <button
                                                            onClick={() => handleSetDefault(address._id)}
                                                            className="text-sm text-gray-600 hover:underline py-1 px-2 rounded hover:bg-gray-100 w-full md:w-auto text-left md:text-right cursor-pointer"
                                                        >
                                                            Set as Default
                                                        </button>
                                                    )}
                                                    {!address.isDefault && (
                                                        <button
                                                            onClick={() => handleDelete(address._id)}
                                                            className="text-sm text-red-600 hover:underline py-1 px-2 rounded hover:bg-red-50 w-full md:w-auto text-left md:text-right cursor-pointer"
                                                        >
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <img className='w-full md:w-1/3 h-fit md:mr-16 mb-16 md:mt-0 mx-auto hidden md:block' src={assets.add_address_image} alt='add address' />
            </div>

            {/* Custom Delete Confirmation Dialog */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className=" bg-gray-100 p-6 rounded-lg max-w-md w-full mx-4 shadow-xl border border-gray-300/70">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Deletion</h3>
                        <p className="text-gray-600 mb-6">Are you sure you want to delete this address? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={cancelDeleteAddress}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteAddress}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AddAddress
