use wasm_bindgen::prelude::*;

pub mod half_2_view;
pub mod float_view;

use crate::half_2_view::Half2View;
use crate::float_view::FloatView;

const THETA_BINS: usize = 64;
const RHO_BINS: usize = 128;

#[derive(Clone, Copy)]
struct EdgeSample {
    theta_bin: u16,
    rho_bin: u16,
    magnitude: f32,
}

#[wasm_bindgen]
pub fn draw(magnitude_bytes: &[u8], hough_bytes: &[u8]) -> Vec<f32> {
    let magnitude = FloatView::new(magnitude_bytes);
    let hough     = Half2View::new(hough_bytes);

    let mut luma = vec![0.0f32; magnitude.len()];
    for i in 0..magnitude.len() {
        let mag = magnitude.get(i);
        let (theta_norm, rho_norm) = hough.get(i);

        luma[i] = mag;
    }
    luma
}
