import React from 'react'
import { assets } from '../assets/assets'
import { Link } from 'react-router-dom'

const MainBanner = () => {
    return (
        <div className='relative'>
            <img src={assets.main_banner_bg} alt="banner" className="w-full hidden md:block" />
            <img src={assets.main_banner_bg_sm} alt="banner" className="w-full md:hidden" />

            <div className='absolute inset-0 flex flex-col items-center md:items-start justify-center md:justify-center pt-20 md:pb-20 px-4 md:px-8 lg:px-12 xl:px-24' >
                <h1 className='text-3xl md:text-4xl lg:text-5xl font-bold text-center md:text-left max-w-xs md:max-w-sm lg:max-w-md leading-tight lg:leading-15 bg-gradient-to-r from-gray-900 to-gray-900 text-transparent bg-clip-text'>Freshness You Can Trust, Savings You will Love!</h1>

                <div className='flex items-center mt-6 font-medium'>
                    <Link to={"/products"} onClick={() => window.scrollTo(0, 0)} className='group flex items-center gap-2 px-7 md:px-9 py-3 bg-primary hover:bg-primary-dull transition rounded text-white cursor-pointer'>
                        Shop Now
                        <img className='md:hidden transition group-focus:translate-x-1' src={assets.white_arrow_icon} alt='arrow' />
                    </Link>
                    <Link to={"/products"} onClick={() => window.scrollTo(0, 0)} className='group hidden md:flex items-center gap-2 px-9 py-3 cursor-pointer'>
                        Explore Deals!
                        <img className='transition group-focus:translate-x-1' src={assets.black_arrow_icon} alt='arrow' />
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default MainBanner